import * as vscode from "vscode";
import DocumentListener from "../document/DocumentListener";
import EditorListener from "../editor/EditorListener";
import { IEditor } from "../models/IEditor";
import { getFileKeyFromUri } from "./fileUtils";
import { Editor } from "../editor/Editor";

export class FileStore {
  private files: Map<string, StoreFile> = new Map();

  getFileByUriFromStore(vsCodeUri: vscode.Uri): StoreFile | null {
    const key = getFileKeyFromUri(vsCodeUri);
    return this.getFileByKeyFromStore(key);
  }

  // REWRITE
  getFileByKeyFromStore(name: string): StoreFile | null {
    if (!this.files.has(name)) {
      return null;
    }
    let file = this.files.get(name);
    return file ?? null;
  }

  addFileToStore(file: StoreFile): void {
    if (this.files.has(file.key)) {
      console.log("File already exists in the store" + file.key);
    }
    this.files.set(file.key, file);
  }
  removeFileFromStore(key: string): void {
    this.files.delete(key);
  }
}

export class StoreFile {
  constructor(
    public readonly key: string,
    public readonly textDocument: vscode.TextDocument,
    public readonly textDocumentListener: DocumentListener,
    public readonly editorChannel: Editor,
    public readonly editorListener: EditorListener
  ) {}
}
