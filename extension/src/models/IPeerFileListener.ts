import * as vscode from "vscode";
import { IEditor } from "./IEditor";
import { Editor } from "../editor/Editor";

export interface IYjsConnectionListener {
  onRemoteFileAddedByPeer(
    fileUri: string,
    editorChannel: Editor
  ): Promise<void>;
  onRemoteFileDeletedByPeer(fileName: string): void;
}
