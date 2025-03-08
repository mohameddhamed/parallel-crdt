import * as vscode from "vscode";
import { PeerEditorDecoratorStore } from "./EditorDecoration";
import { IEditorListener } from "../models/Interfaces";
import { Position, Selection } from "../models/Classes";
import { get } from "http";
import {
  convertPositionToVsCodePosition,
  convertVsCodePositionToPosition,
} from "../models/Utils";
import { getFileKeyFromUri } from "../models/Utils";
import { Editor } from "./Editor";

export default class EditorListener implements IEditorListener {
  private peerEditorDecoratorStore = PeerEditorDecoratorStore.getInstance();
  constructor(public editorChannel: Editor) {
    // Register an instance of EditorListener as a listener for events or changes that occur within the IEditorChannel.
    // This allows the EditorListener to respond to these events and perform actions accordingly.
    this.editorChannel.addEditorListener(this);
  }

  onSelectionsChangedForPeerInFile(
    selections: Selection[],
    peerName: string,
    fileKey: string
  ): Promise<void> {
    // A vscode.Range object represents a span of text between two positions in a text document. It is defined
    // by a start position and an end position, both of which are instances of vscode.Position.
    const selectionRanges: vscode.Range[] = [];
    const cursorRanges: vscode.Range[] = [];
    const peerNameRanges: vscode.Range[] = [];

    for (const selection of selections) {
      // represents a cursor position.
      // indicating that the selection is a single point (cursor) rather than a range of text.
      if (selection.isCursor) {
        cursorRanges.push(
          new vscode.Range(
            convertPositionToVsCodePosition(selection.start),
            convertPositionToVsCodePosition(selection.end)
          )
        );
      } else {
        // range of text
        selectionRanges.push(
          new vscode.Range(
            convertPositionToVsCodePosition(selection.start),
            convertPositionToVsCodePosition(selection.end)
          )
        );
      }
      // COME BACK TO THIS
      peerNameRanges.push(
        new vscode.Range(
          convertPositionToVsCodePosition(
            new Position(selection.end.row + 1, selection.end.column)
          ),
          convertPositionToVsCodePosition(
            new Position(selection.end.row + 1, selection.end.column)
          )
        )
      );
    }
    for (const editor of vscode.window.visibleTextEditors) {
      if (getFileKeyFromUri(editor.document.uri) === fileKey) {
        const peerEditorDecorator =
          this.peerEditorDecoratorStore.getPeerDecorator(peerName);
        editor.setDecorations(
          peerEditorDecorator.selectionDecoration,
          selectionRanges
        );
        editor.setDecorations(
          peerEditorDecorator.cursorDecoration,
          cursorRanges
        );
        editor.setDecorations(
          peerEditorDecorator.nameDecoration,
          peerNameRanges
        );
      }
    }
    return Promise.resolve();
  }

  updateRemoteSelectionsWithLocal(
    selections: readonly vscode.Selection[]
  ): void {
    const remoteSelections: Selection[] = [];
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      remoteSelections.push(
        new Selection(
          i + "",
          selection.isReversed,
          selection.isEmpty,
          convertVsCodePositionToPosition(selection.start),
          convertVsCodePositionToPosition(selection.end)
        )
      );
    }
    this.editorChannel.sendLocalSelectionsToRemote(remoteSelections);
  }
}
