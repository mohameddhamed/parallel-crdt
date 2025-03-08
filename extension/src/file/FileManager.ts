import * as vscode from "vscode";
import { FileManagerUtils } from "./FileManagerUtils";
import { getAllFilesInDir, getFileKeyFromUri } from "../models/Utils";
import EditorListener from "../editor/EditorListener";
import { IYFileManagerListener } from "../models/Interfaces";
import { FileStore, StoreFile } from "./FileStore";
import { EditorManager } from "../editor/EditorManager";
import { DocumentManager } from "../document/DocumentManager";
import DocumentListener from "../document/DocumentListener";
import { YFileManager } from "./YFileManager";
import { Editor } from "../editor/Editor";
import { Session } from "../session/Session";

export class FileManager implements IYFileManagerListener {
  private fileStore = new FileStore();
  private documentManager: DocumentManager = new DocumentManager(
    this.fileStore,
    this
  );
  private editorManager: EditorManager = new EditorManager(this.fileStore);

  constructor(
    private yFileManager: YFileManager,
    private fileShareManagerUtils: FileManagerUtils
  ) {}

  async shareLocalFilesToPeers(workspaceFolderPath: string): Promise<void> {
    // Share all files in the workspace
    if (!workspaceFolderPath) {
      console.error("Workspace path is not set");
      return;
    }
    // Get all files in the workspace
    const workspaceFiles = await getAllFilesInDir(workspaceFolderPath);
    console.log("Sharing all files in the workspace: ", workspaceFiles);
    // Share each file
    for (const file of workspaceFiles) {
      try {
        await this.shareLocalFileToPeers(file);
      } catch (e) {
        console.error("Error sharing file: ", e, file);
      }
    }
  }

  async shareLocalFileToPeers(fileUri: vscode.Uri): Promise<void> {
    console.log("FileShareManager: Sharing file with URI: ", fileUri.fsPath);

    const fileKey = getFileKeyFromUri(fileUri);
    let sharedFile = this.fileStore.getFileByKeyFromStore(fileKey);

    if (sharedFile) {
      console.log("File already shared and exists for file key: ", fileKey);
    }

    const editorChannel = this.yFileManager.shareLocalFileToPeers(fileKey);
    sharedFile = await this.createAndSaveSharedFile(
      fileKey,
      fileUri,
      editorChannel
    );
    this.documentManager.syncInitialLocalText(sharedFile!.textDocument);
  }
  async deleteLocalDir(dirUri: vscode.Uri): Promise<void> {
    (await getAllFilesInDir(dirUri.fsPath)).forEach((fileUri) => {
      this.fileShareManagerUtils.deleteFileLocally(fileUri);
    });
  }

  async onRemoteFileAddedByPeer(
    fileKey: string,
    editorChannel: Editor
  ): Promise<void> {
    console.log("FileShareManager: Remote file : ", fileKey, " added by peer");
    const localFileUri = this.fileShareManagerUtils.addFileLocally(fileKey);
    if (!localFileUri) {
      console.warn(
        "FileShareManager: Error adding file to workspace: ",
        fileKey,
        "probably already exists"
      );
      return;
    }
    const storeFile = this.fileStore.getFileByKeyFromStore(fileKey);
    if (storeFile) {
      console.warn("File already exists in the store: ", fileKey);
      return;
    }
    console.log(
      "FileShareManager: Creating and saving shared file: ",
      localFileUri.fsPath
    );
    await this.createAndSaveSharedFile(fileKey, localFileUri, editorChannel);
  }

  private async createAndSaveSharedFile(
    fileKey: string,
    fileUri: vscode.Uri,
    editorChannel: Editor
  ): Promise<StoreFile> {
    const editorListener = new EditorListener(editorChannel);

    const documentOpened = await this.editorManager.openTextDocument(fileUri);
    const documentListener = new DocumentListener(
      documentOpened,
      editorChannel.getDocument()
    );

    const sharedPeerFile = new StoreFile(
      fileKey,
      documentOpened,
      documentListener,
      editorChannel,
      editorListener
    );

    this.fileStore.addFileToStore(sharedPeerFile);

    return sharedPeerFile;
  }
  onRemoteFileDeletedByPeer(fileKey: string): void {
    console.log("FileShareManager: Remote file deleted by peer: ", fileKey);
    const peerFile = this.fileStore.getFileByKeyFromStore(fileKey);
    if (!peerFile) {
      console.warn("FileShareManager: No file found with name: ", fileKey);
      return;
    }
    this.fileStore.removeFileFromStore(peerFile.key);
    this.fileShareManagerUtils.deleteFileLocally(
      this.fileShareManagerUtils.getUriOfFile(fileKey)
    );
  }
  deleteLocalFile(fileUri: vscode.Uri): void {
    console.log(
      "FileShareManager: Deleting local file with URI: ",
      fileUri.fsPath
    );
    const fileKey = getFileKeyFromUri(fileUri);
    const sharedFile = this.fileStore.getFileByKeyFromStore(fileKey);

    if (!sharedFile) {
      console.warn("FileShareManager: No file found with name: ", fileKey);
      return;
    }
    this.yFileManager.deleteLocalFile(fileKey);
    this.fileStore.removeFileFromStore(fileKey);
  }
}
