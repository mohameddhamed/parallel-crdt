import * as vscode from "vscode";
import { IDocumentListener } from "../models/IDocument";
import { Position, TextChange, TextChangeType } from "../models/EditorStructs";
import { getVsCodeRange } from "../editor/editorUtils";
import { Document } from "./Document";

export default class DocumentListener implements IDocumentListener {
  public mutexIsLocked: boolean = false;

  constructor(
    public document: vscode.TextDocument,
    public documentChannel: Document
  ) {
    this.documentChannel.addDocumentListener(this);
  }
  public async onRemoteTextInitialized(text: string): Promise<void> {
    console.log("DocumentListener: Remote text initialized: ", text);
    // specifies a range of text to be edited and the new text to be
    // inserted or used to replace the existing text.
    const textInitializedEdit = new vscode.TextEdit(
      // insert the new text at the very beginning of the document
      new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
      text
    );
    await this.applyTextEdits(this.document, [textInitializedEdit]);
  }

  public async onRemoteTextChanged(textChanges: TextChange[]): Promise<void> {
    console.log("DocumentListener: Remote text changed: ", textChanges.length);
    const textChangedEdits = textChanges.map((textChange) => {
      return new vscode.TextEdit(
        getVsCodeRange(textChange.start, textChange.end),
        textChange.text
      );
    });
    await this.applyTextEdits(this.document, textChangedEdits);
  }

  public async onDocumentSaveRequested(): Promise<void> {
    await this.document.save();
  }

  public onLocalTextChangesToDocument(
    changes: readonly vscode.TextDocumentContentChangeEvent[]
  ): void {
    console.log("DocumentListener: Local text changes: ", changes.length);
    if (this.mutexIsLocked) {
      return;
    }
    [...changes]
      .sort((a, b) => a.rangeOffset - b.rangeOffset)
      .map(
        (change) =>
          new TextChange(
            TextChangeType.UPDATE,
            new Position(change.range.start.line, change.range.start.character),
            new Position(change.range.end.line, change.range.end.character),
            change.text
          )
      )
      .forEach((change) => {
        this.documentChannel.transactAndApplyTextChange(change);
      });
  }

  public saveAndReturnPromise(): Promise<void> {
    this.documentChannel.sendSaveRequestToPeers();
    return Promise.resolve();
  }

  public async applyTextEdits(
    document: vscode.TextDocument,
    textEdits: vscode.TextEdit[]
  ): Promise<void> {
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, textEdits);
    await this.applyTextEdit(workspaceEdit);
  }

  // REWRITE
  private async applyTextEdit(
    workspaceEdit: vscode.WorkspaceEdit
  ): Promise<void> {
    try {
      while (!(await this.applyEdit(workspaceEdit))) {
        console.warn("DocumentListener: Document is locked, retrying...");
      }
      console.info("DocumentListener: Document updated successfully.");
    } catch (error) {
      console.error("DocumentListener: Error updating document: ", error);
    }
  }

  private async applyEdit(
    workspaceEdit: vscode.WorkspaceEdit
  ): Promise<boolean> {
    this.mutexIsLocked = true;
    const result = await vscode.workspace.applyEdit(workspaceEdit);
    this.mutexIsLocked = false;
    return result;
  }
}
