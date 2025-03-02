import * as vscode from "vscode";
import { IEditorChannel } from "./IEditorChannel";

export interface IPeerFileListener {
  onRemoteFileAddedByPeer(
    fileUri: string,
    editorChannel: IEditorChannel
  ): Promise<void>;
  onRemoteFileDeletedByPeer(fileName: string): void;
}
