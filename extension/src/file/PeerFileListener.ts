import * as vscode from "vscode";
import { IEditorChannel } from "../editor/IEditorChannel";

export interface PeerFileListener {
  onRemoteFileAddedByPeer(
    fileUri: string,
    editorChannel: IEditorChannel
  ): Promise<void>;
  onRemoteFileDeletedByPeer(fileName: string): void;
}
