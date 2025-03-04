import * as fs from "fs";
import * as vscode from "vscode";
import { FileStore } from "../file/FileStore";
import { FileShareManager } from "../file/FileShareManager";
export interface IDocumentManger {
  initializeLocalTextToRemote(document: vscode.TextDocument): void;
}

export class DocumentManager implements IDocumentManger {
  constructor(
    private fileStore: FileStore,
    private sharerFromLocalToRemote: FileShareManager
  ) {
    // COME BACK TO THIS LATER
    vscode.workspace.onDidChangeTextDocument(
      this.onChangeLocalTextDocument.bind(this)
    );
    vscode.workspace.onWillSaveTextDocument(
      this.onSaveLocalDocument.bind(this)
    );
    vscode.workspace.onDidCreateFiles(this.onAddFiles.bind(this));
    vscode.workspace.onDidDeleteFiles(this.onDeleteFiles.bind(this));
    vscode.workspace.onDidRenameFiles(this.onRenameFiles.bind(this));
  }

  public initializeLocalTextToRemote(document: vscode.TextDocument): void {
    try {
      const initialLocalText = document.getText();
      const changeEventObject = {
        document: document,
        contentChanges: [
          {
            range: new vscode.Range(
              new vscode.Position(0, 0),
              new vscode.Position(0, 0)
            ),
            rangeOffset: 0,
            rangeLength: 0,
            text: initialLocalText,
          },
        ],
        reason: undefined,
      };
      this.onChangeLocalTextDocument(changeEventObject);
    } catch (e) {
      console.error("initialize Local Text To Remote error" + e);
      return;
    }
  }
  private onChangeLocalTextDocument(e: vscode.TextDocumentChangeEvent): void {
    if (e.contentChanges.length === 0) {
      console.log(
        "No content changes, reason: ",
        e.reason,
        "document: ",
        e.document
      );
      return;
    }
    console.log(
      "Handling local text change event: ",
      e.contentChanges.length,
      ", document: ",
      e.document
    );

    const fileToBeShared = this.fileStore.getFileByUriFromStore(e.document.uri);
    if (!fileToBeShared) {
      console.error("File not found in store: ", e.document.uri);
      return;
    }
    fileToBeShared.textDocumentListener.onLocalTextChangesToDocument(
      e.contentChanges
    );
  }
  private onSaveLocalDocument(e: vscode.TextDocumentWillSaveEvent): void {
    console.log("handling save event for document: ", e.document.uri);
    const fileToBeShared = this.fileStore.getFileByUriFromStore(e.document.uri);
    if (!fileToBeShared) {
      console.error("File not found in store: ", e.document.uri);
      return;
    }
    e.waitUntil(fileToBeShared.textDocumentListener.saveAndReturnPromise());
  }
  private onAddFiles(e: vscode.FileCreateEvent): void {
    console.log("handling file create event: ", e.files);
    e.files.forEach((file) => {
      if (fs.lstatSync(file.fsPath).isDirectory()) {
        return; // ignore directories
      }
      this.sharerFromLocalToRemote.shareLocalFileToRemote(file);
    });
  }
  private onDeleteFiles(e: vscode.FileDeleteEvent): void {
    console.log("handling file delete event: ", e.files);
    e.files.forEach((file) => {
      this.sharerFromLocalToRemote.deleteLocalFile(file);
    });
  }
  // Come back to this later
  private onRenameFiles(e: vscode.FileRenameEvent): void {
    console.log("handling file rename event: ", e.files);
    // e.files.forEach((file) => {
    //   this.sharerFromLocalToRemote.deleteLocalFile(file.oldUri);
    //   this.sharerFromLocalToRemote.shareLocalFileToRemote(file.newUri);
    // });
  }
}
