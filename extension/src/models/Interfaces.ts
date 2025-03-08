import { Editor } from "../editor/Editor";
import { TextChange } from "./Classes";
import { Peer } from "./Classes";
import { Selection } from "./Classes";

export interface IDocumentListener {
  onPeerTextInitialized(text: string): Promise<void>;
  onPeerTextChanged(textChanges: TextChange[]): Promise<void>;
  onDocumentSaveRequested(): Promise<void>;
}
export interface IEditorListener {
  onSelectionsChangedForPeerInFile(
    selections: Selection[],
    peerName: string,
    fileKey: string
  ): void;
}

export interface IPeerConnectionListener {
  onPeerAdded(peer: Peer): void;
  onPeerRemoved(peer: Peer): void;
}

export interface IYFileManagerListener {
  onRemoteFileAddedByPeer(
    fileUri: string,
    editorChannel: Editor
  ): Promise<void>;
  onRemoteFileDeletedByPeer(fileName: string): void;
}
