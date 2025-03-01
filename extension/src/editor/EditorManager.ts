import * as vscode from "vscode";
import { FileStore } from "../file/FileStore";
export interface IEditorManager {
  openTextDocument(documentUri: vscode.Uri): Promise<vscode.TextDocument>;
}

export class EditorManager implements IEditorManager {
  constructor(private fileStore: FileStore) {
    // review
    vscode.window.onDidChangeTextEditorSelection(
      this.onDidChangeLocalTextEditorSelection.bind(this)
    );
  }
  async openTextDocument(
    documentUri: vscode.Uri
  ): Promise<vscode.TextDocument> {
    return vscode.workspace.openTextDocument(documentUri);
  }
  private onDidChangeLocalTextEditorSelection(
    e: vscode.TextEditorSelectionChangeEvent
  ): void {
    const file = this.fileStore.getFileByUriFromStore(
      e.textEditor.document.uri
    );
    if (file) {
      file.editorListener.updateRemoteSelectionsWithLocal(e.selections);
    }
  }
}
