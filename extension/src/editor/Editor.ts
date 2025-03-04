import { get } from "http";
import { ObservedBy } from "../ObservedBy";
import { Document } from "../document/Document";
import { PeerFileMap } from "../models/PeerFile";
import { Peer } from "../models/Peer";
import { PeerSelection, Selection } from "../models/EditorStructs";
import { IEditorListener } from "../models/IEditorListener";
import * as Y from "yjs";

// change name to Editor
export class Editor extends ObservedBy<IEditorListener> {
  private readonly documentChannel: Document;
  constructor(
    private yjsDoc: Y.Doc,
    private currentUserName: string,
    public yjsFile: PeerFileMap
  ) {
    super();
    const peerSelectionEventListener = (
      event: Y.YArrayEvent<PeerSelection>,
      transaction: Y.Transaction
    ): void => {
      if (transaction.origin === this.currentUserName) {
        return;
      }
      this.onPeerSelectionsChanged(event);
    };
    // handle changes to the peer selections using the peerSelectionEventListener
    // observe is a Yjs method that listens for changes to a Y.Array type
    this.yjsFile.peerSelections.observe(peerSelectionEventListener);
    this.documentChannel = new Document(yjsDoc, currentUserName, yjsFile);
  }

  addEditorChannelListener(listener: IEditorListener): void {
    super.registerListener(listener);
  }

  getDocumentChannel(): Document {
    return this.documentChannel;
  }

  sendLocalSelectionsToRemote(localSelections: Selection[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.yjsDoc.transact(() => {
          // iterate over all the selections
          for (let i = this.yjsFile.peerSelections.length - 1; i >= 0; i--) {
            // if these selections are from the current user, remove them
            if (
              this.yjsFile.peerSelections.get(i).peerName ===
              this.currentUserName
            ) {
              this.yjsFile.peerSelections.delete(i);
            }
          }
          for (const localSelection of localSelections) {
            this.yjsFile.peerSelections.push([
              { peerName: this.currentUserName, selection: localSelection },
            ]);
          }
          resolve();
        }, this.currentUserName);
      } catch (error) {
        reject(error);
      }
    });
  }

  private getPeerFromSelection(item: Y.Item, peersNamesSelecting: Set<string>) {
    for (const selection of item.content.getContent()) {
      const peerSelection = selection as PeerSelection;
      peersNamesSelecting.add(peerSelection.peerName);
    }
  }
  private getSelectionsFromPeer(
    peerSelections: Y.Array<PeerSelection>,
    peerName: string
  ): Selection[] {
    return peerSelections
      .toArray()
      .filter((peerSelection) => peerSelection.peerName === peerName)
      .map((peerSelection) => peerSelection.selection);
  }
  private getPeersChangingSelections(
    selectionEvents: Y.YArrayEvent<PeerSelection>
  ): Set<string> {
    const peersNamesSelecting = new Set<string>();
    for (const selectionAdded of selectionEvents.changes.added) {
      this.getPeerFromSelection(selectionAdded, peersNamesSelecting);
    }

    for (const selectionDeleted of selectionEvents.changes.deleted) {
      this.getPeerFromSelection(selectionDeleted, peersNamesSelecting);
    }

    return peersNamesSelecting;
  }

  private notifyPeersOfSelectionChanges(
    peersChangingSelections: Set<string>,
    selectionEvent: Y.YArrayEvent<PeerSelection>
  ): void {
    for (const peerChangingSelections of peersChangingSelections) {
      const peerSelections = this.getSelectionsFromPeer(
        selectionEvent.target,
        peerChangingSelections
      );

      this.notifyListeners((listener: IEditorListener) =>
        listener.onSelectionsChangedForPeerInFile(
          peerSelections,
          peerChangingSelections,
          this.yjsFile.peerFileKey
        )
      );
    }
  }
  private onPeerSelectionsChanged(
    selectionEvents: Y.YArrayEvent<PeerSelection>
  ): void {
    const peersChangingSelections =
      this.getPeersChangingSelections(selectionEvents);
    this.notifyPeersOfSelectionChanges(
      peersChangingSelections,
      selectionEvents
    );
  }
}
