import { get } from "http";
import { ObservedBy } from "../ObservedBy";
import { TextChange, TextChangeType } from "../models/EditorStructs";
import {
  getIndexFromPosition,
  getPositionFromIndex,
} from "../editor/editorUtils";
import { PeerFileMap } from "../models/PeerFile";
import {
  IDocumentChannel,
  IDocumentChannelListener,
} from "../models/IDocumentChannel";
import * as Y from "yjs";

export class DocumentChannel
  extends ObservedBy<IDocumentChannelListener>
  implements IDocumentChannel
{
  private currentText: string = "";
  constructor(
    private yjsDoc: Y.Doc,
    private currentUserName: string,
    public yjsFile: PeerFileMap
  ) {
    super();
    this.initObservers();

    // Notify listeners of the initial text
    if (this.yjsFile.peerText.length > 0) {
      this.currentText = this.yjsFile.peerText.toString();
      const text = this.currentText;
      console.log(
        "DocumentChannel: constructor: text: ",
        text,
        "length: ",
        text.length
      );
      this.notifyListeners(
        async (listener) => await listener.onRemoteTextInitialized(text)
      );
    }
  }
  addDocumentListener(listener: IDocumentChannelListener): void {
    super.registerListener(listener);
  }

  sendLocalTextChangesToRemote(textChanges: TextChange[]): void {
    console.log(
      "DocumentChannel: sendLocalTextChangesToRemote: change: ",
      textChanges
    );
    this.yjsDoc.transact(() => {
      textChanges.forEach(async (textChange) => {
        await this.transactAndApplyTextChange(textChange);
      });
    }, this.currentUserName);
  }

  async transactAndApplyTextChange(textChange: TextChange): Promise<void> {
    console.log(
      "DocumentChannel: transactAndApplyChange: textChange: ",
      textChange
    );
    const indexBegin = getIndexFromPosition(this.currentText, textChange.start);
    const indexEnd = getIndexFromPosition(this.currentText, textChange.end);

    this.transactTextChange(textChange, indexBegin, indexEnd);
    this.applyTextChange(textChange);
  }

  sendSaveRequestToPeers(): void {
    this.yjsDoc.transact(() => {
      this.yjsFile.peerSaveRequests.push([this.currentUserName]);
    }, this.currentUserName);
  }
  // addDocumentChannelListener(listener: IDocumentChannelListener): void {
  //   super.registerListener(listener);
  // }
  private transactTextChange(
    textChange: TextChange,
    indexBegin: number,
    indexEnd: number
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
    }, this.currentUserName);
  }

  private initObservers(): void {
    const yjsTextEventListener = async (
      event: Y.YTextEvent,
      transaction: Y.Transaction
    ): Promise<void> => {
      if (transaction.origin === this.currentUserName) {
        return;
      }
      await this.onRemoteTextChanged(event);
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

  private async onRemoteTextChanged(event: Y.YTextEvent): Promise<void> {
    const textChanges: TextChange[] = [];
    let textPosition = 0;

    for (const delta of event.changes.delta) {
      //  certain number of characters should be skipped or retained without any changes.
      if (delta.retain) {
        textPosition += delta.retain;
      } else if (delta.delete) {
        const textToBeDeleted = new TextChange(
          TextChangeType.DELETE,
          getPositionFromIndex(this.currentText, textPosition),
          getPositionFromIndex(this.currentText, textPosition + delta.delete),
          ""
        );
        textChanges.push(textToBeDeleted);
        this.applyTextChange(textToBeDeleted);
      } else if (delta.insert) {
        const textToBeInserted = new TextChange(
          TextChangeType.INSERT,
          getPositionFromIndex(this.currentText, textPosition),
          getPositionFromIndex(this.currentText, textPosition),
          delta.insert as string
        );
        textChanges.push(textToBeInserted);
        this.applyTextChange(textToBeInserted);
        textPosition += delta.insert.length;
      }
    }
    const reversedTextChanges = [...textChanges].reverse();

    this.notifyListeners(
      async (listener) =>
        await listener.onRemoteTextChanged(reversedTextChanges)
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
  private applyTextChange(textChange: TextChange): void {
    const indexBegin = getIndexFromPosition(this.currentText, textChange.start);
    const indexEnd = getIndexFromPosition(this.currentText, textChange.end);
    const beginText = this.currentText.slice(0, indexBegin);
    const endText = this.currentText.slice(indexEnd);
    this.currentText = `${beginText}${textChange.text}${endText}`;
  }
}
