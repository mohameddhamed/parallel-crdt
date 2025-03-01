import { IEditorChannel } from "../editor/IEditorChannel";

export interface IConnectionListener {
  deleteLocalFile(fileKey: string): void;
  sendLocalFileToPeers(file: string): IEditorChannel;
}
