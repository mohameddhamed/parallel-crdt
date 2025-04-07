import { ObservedBy } from "../ObservedBy";
import {
  IPeerFile,
  Position,
  TextChange,
  TextChangeType,
} from "../models/Classes";
import { getIndexFromPosition, getPositionFromIndex } from "../models/Utils";
import { IDocumentListener } from "../models/Interfaces";
import * as Y from "yjs";

// change name to Document
export class Document extends ObservedBy<IDocumentListener> {
  // A local representation of the document's text content
  // used for tracking text changes
  private currentDocumentTextState: string = "";
  // Add a history array to track changes by peer
  private changeHistory: { peer: string; change: TextChange }[] = [];
  constructor(
    private yjsDoc: Y.Doc,
    private currentUserName: string,
    public yjsFile: IPeerFile
  ) {
    super();
    this.setupDocumentListeners();

    // Notify listeners of the initial text
    if (this.yjsFile.peerText.length > 0) {
      this.currentDocumentTextState = this.yjsFile.peerText.toString();
      const text = this.currentDocumentTextState;
      console.log(
        "DocumentChannel: constructor: text: ",
        text,
        "length: ",
        text.length
      );
      this.notifyListeners(
        async (listener) => await listener.onPeerTextInitialized(text)
      );
    }
  }
  addDocumentListener(listener: IDocumentListener): void {
    super.registerListener(listener);
  }

  sendLocalTextChangesToRemote(textChanges: TextChange[]): void {
    console.log(
      "DocumentChannel: sendLocalTextChangesToRemote: change: ",
      textChanges
    );
    this.yjsDoc.transact(() => {
      textChanges.forEach(async (textChange) => {
        await this.transactAndApplyTextChange(textChange, this.currentUserName);
      });
    }, this.currentUserName);
  }

  // Update to accept peer parameter
  async transactAndApplyTextChange(
    textChange: TextChange,
    peer: string = this.currentUserName
  ): Promise<void> {
    console.log(
      "DocumentChannel: transactAndApplyChange: textChange: ",
      textChange
    );
    const indexBegin = getIndexFromPosition(
      this.currentDocumentTextState,
      textChange.start
    );
    const indexEnd = getIndexFromPosition(
      this.currentDocumentTextState,
      textChange.end
    );

    this.transactTextChange(textChange, indexBegin, indexEnd, peer);
    this.applyTextChange(textChange, peer);
  }

  sendSaveRequestToPeers(): void {
    this.yjsDoc.transact(() => {
      this.yjsFile.peerSaveRequests.push([this.currentUserName]);
    }, this.currentUserName);
  }
  private transactTextChange(
    textChange: TextChange,
    indexBegin: number,
    indexEnd: number,
    peer: string
  ): void {
    this.yjsDoc.transact(() => {
      if (textChange.type === TextChangeType.INSERT) {
        this.yjsFile.peerText.insert(indexBegin, textChange.text);
      } else if (textChange.type === TextChangeType.DELETE) {
        this.yjsFile.peerText.delete(indexBegin, indexEnd - indexBegin);
      } else if (textChange.type === TextChangeType.UPDATE) {
        // If the text is the same, do nothing
        if (indexBegin !== indexEnd) {
          this.yjsFile.peerText.delete(indexBegin, indexEnd - indexBegin);
        }
        this.yjsFile.peerText.insert(indexBegin, textChange.text);
      }
    }, peer);
  }

  private setupDocumentListeners(): void {
    const yjsTextEventListener = async (
      event: Y.YTextEvent,
      transaction: Y.Transaction
    ): Promise<void> => {
      if (transaction.origin === this.currentUserName) {
        return;
      }
      await this.onPeerTextChanged(event);
    };
    const yjsSaveRequestEventListener = (
      event: Y.YArrayEvent<string>,
      transaction: Y.Transaction
    ): void => {
      if (transaction.origin === this.currentUserName) {
        return;
      }
      this.onRemoteSaveRequested(event);
    };
    this.yjsFile.peerText.observe(yjsTextEventListener);
    this.yjsFile.peerSaveRequests.observe(yjsSaveRequestEventListener);
  }

  private async onPeerTextChanged(event: Y.YTextEvent): Promise<void> {
    const textChanges: TextChange[] = [];
    let textPosition = 0;

    for (const delta of event.changes.delta) {
      //  certain number of characters should be skipped or retained without any changes.
      if (delta.retain) {
        textPosition += delta.retain;
      } else if (delta.delete) {
        const textToBeDeleted = new TextChange(
          TextChangeType.DELETE,
          getPositionFromIndex(this.currentDocumentTextState, textPosition),
          getPositionFromIndex(
            this.currentDocumentTextState,
            textPosition + delta.delete
          ),
          ""
        );
        textChanges.push(textToBeDeleted);
        this.applyTextChange(
          textToBeDeleted,
          event.transaction.origin as string
        );
      } else if (delta.insert) {
        const textToBeInserted = new TextChange(
          TextChangeType.INSERT,
          getPositionFromIndex(this.currentDocumentTextState, textPosition),
          getPositionFromIndex(this.currentDocumentTextState, textPosition),
          delta.insert as string
        );
        textChanges.push(textToBeInserted);
        this.applyTextChange(
          textToBeInserted,
          event.transaction.origin as string
        );
        textPosition += delta.insert.length;
      }
    }
    const reversedTextChanges = [...textChanges].reverse();

    this.notifyListeners(
      async (listener) => await listener.onPeerTextChanged(reversedTextChanges)
    );
  }

  private onRemoteSaveRequested(event: Y.YArrayEvent<string>): void {
    if (this.yjsFile.peerSaveRequests.length > 0) {
      this.notifyListeners(
        async (listener) => await listener.onDocumentSaveRequested()
      );
      this.yjsDoc.transact(() => {
        this.yjsFile.peerSaveRequests.delete(
          0,
          this.yjsFile.peerSaveRequests.length
        );
      }, this.currentUserName);
    }
  }

  // Update to record changes in history
  private applyTextChange(textChange: TextChange, peer: string): void {
    const indexBegin = getIndexFromPosition(
      this.currentDocumentTextState,
      textChange.start
    );
    const indexEnd = getIndexFromPosition(
      this.currentDocumentTextState,
      textChange.end
    );
    const beginText = this.currentDocumentTextState.slice(0, indexBegin);
    const endText = this.currentDocumentTextState.slice(indexEnd);
    this.currentDocumentTextState = `${beginText}${textChange.text}${endText}`;

    console.log("Document: recording change: ", textChange, " peer: ", peer);
    // Record the change in history
    this.changeHistory.push({ peer, change: textChange });
  }

  // Get changes made by a specific peer
  getChangesByPeer(peer: string): TextChange[] {
    console.log("Document: Change history: ", this.changeHistory);
    let changes: TextChange[] = [];
    if (peer == this.currentUserName) {
      changes = this.changeHistory
        .filter((entry) => entry.peer === this.currentUserName)
        .map((entry) => entry.change);
    } else {
      changes = this.changeHistory
        .filter(
          (entry) => entry.peer !== this.currentUserName && entry.peer != null
        )
        .map((entry) => entry.change);
    }
    console.log(
      "DocumentChannel: getChangesByPeer: peer: ",
      peer,
      " changes: ",
      changes
    );
    return changes;
  }

  positionCompare(position1: Position, position2: Position): number {
    if (position1.row === position2.row) {
      return position1.column - position2.column;
    } else {
      return 0;
    }
  }
  // Revert changes made by a specific peer
  getNumberOfChangesByPeer(
    peer: string
  ): [insertCount: number, deleteCount: number] {
    const changes = this.getChangesByPeer(peer).reverse();
    console.log(
      "DocumentChannel: revertChangesByPeer: peer: ",
      peer,
      " changes: ",
      changes
    );
    let insertCount = 0,
      deleteCount = 0;
    changes.forEach((change) => {
      if (this.positionCompare(change.start, change.end) < 0) {
        deleteCount++;
      } else if (change.text != "" && change.type === TextChangeType.INSERT) {
        insertCount++;
      }
    });
    return [insertCount, deleteCount];
  }
  revertChangesByPeer(peer: string): void {
    const changes = this.getChangesByPeer(peer).reverse();
    console.log(
      "DocumentChannel: revertChangesByPeer: peer: ",
      peer,
      " changes: ",
      changes
    );
    changes.forEach((change) => {
      if (change.type === TextChangeType.INSERT) {
        // Revert insertion by deleting the text
        const indexBegin = getIndexFromPosition(
          this.currentDocumentTextState,
          change.start
        );
        const indexEnd = indexBegin + change.text.length;
        this.yjsFile.peerText.delete(indexBegin, indexEnd - indexBegin);
      } else if (change.type === TextChangeType.DELETE) {
        // Revert deletion by re-inserting the text
        const indexBegin = getIndexFromPosition(
          this.currentDocumentTextState,
          change.start
        );
        this.yjsFile.peerText.insert(indexBegin, change.text);
      }
    });
    // Clear this peer's history after reverting
    this.changeHistory = this.changeHistory.filter(
      (entry) => entry.peer !== peer
    );
  }
}
