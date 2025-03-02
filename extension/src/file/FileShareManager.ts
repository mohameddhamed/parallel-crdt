import * as vscode from "vscode";
import { FileSystemManager } from "./FileSystemManager";
import { getAllFilesInDir, getFileKeyFromUri } from "./fileUtils";
import EditorListener from "../editor/EditorListener";
import { IEditorChannel } from "../models/IEditorChannel";
import { IPeerFileListener } from "../models/IPeerFileListener";
import { FileStore, StoreFile } from "./FileStore";
import { EditorManager, IEditorManager } from "../editor/EditorManager";
import { DocumentManager, IDocumentManger } from "../document/DocumentManager";
import DocumentListener from "../document/DocumentListener";
import { YjsListener } from "../yjs/YjsListener";

export class FileShareManager implements IPeerFileListener {
  private fileStore = new FileStore();
  private documentManager: IDocumentManger = new DocumentManager(
    this.fileStore,
    this
  );
  private editorManager: IEditorManager = new EditorManager(this.fileStore);

  constructor(
    private connectionBinder: YjsListener,
    private fileSystemManager: FileSystemManager
  ) {}
  async shareLocalFileToRemote(fileUri: vscode.Uri): Promise<void> {
    console.log("FileShareManager: Sharing file with URI: ", fileUri.fsPath);

    const fileKey = getFileKeyFromUri(fileUri);
    let sharedFile = this.fileStore.getFileByKeyFromStore(fileKey);

    if (sharedFile) {
      console.log("File already shared and exists for file key: ", fileKey);
    }

    const editorChannel = this.connectionBinder.sendLocalFileToPeers(fileKey);
    sharedFile = await this.createAndSaveSharedFile(
      fileKey,
      fileUri,
      editorChannel
    );
    this.documentManager.initializeLocalTextToRemote(sharedFile!.textDocument);
  }
  async deleteLocalDir(dirUri: vscode.Uri): Promise<void> {
    (await getAllFilesInDir(dirUri.fsPath)).forEach((fileUri) => {
      this.fileSystemManager.deleteFile(fileUri);
    });
  }

  async onRemoteFileAddedByPeer(
    fileKey: string,
    editorChannel: IEditorChannel
  ): Promise<void> {
    console.log("FileShareManager: Remote file : ", fileKey, " added by peer");
    const localFileUri = this.fileSystemManager.addFileToWorkspace(fileKey);
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
    editorChannel: IEditorChannel
  ): Promise<StoreFile> {
    const editorListener = new EditorListener(editorChannel);

    const documentOpened = await this.editorManager.openTextDocument(fileUri);
    const documentListener = new DocumentListener(
      documentOpened,
      editorChannel.getDocumentChannel()
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
    this.fileSystemManager.deleteFile(
      this.fileSystemManager.getUriOfFile(fileKey)
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
    this.connectionBinder.deleteLocalFile(fileKey);
    this.fileStore.removeFileFromStore(fileKey);
  }
}
