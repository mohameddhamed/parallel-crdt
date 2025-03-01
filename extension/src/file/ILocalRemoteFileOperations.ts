import * as vscode from "vscode";
import { IEditorChannel } from "../editor/IEditorChannel";

export interface RemoteFileListener {
  onRemoteFileAddedByPeer(
    fileUri: string,
    editorChannel: IEditorChannel
  ): Promise<void>;
  onRemoteFileDeletedByPeer(fileName: string): void;
}

export interface ILocalRemoteFileOperations {
  shareLocalFileToRemote(fileUri: vscode.Uri): Promise<void>;
  deleteLocalFile(fileUri: vscode.Uri): void;
  deleteLocalDir(dirUri: vscode.Uri): Promise<void>;
}
