import { Peer } from "./Peer";
import { Selection } from "./EditorStructs";
import { Document } from "../document/Document";

export interface IEditor {
  addEditorChannelListener(listener: IEditorListener): void;
  getDocumentChannel(): Document;
  sendLocalSelectionsToRemote(selections: Selection[]): void;
}

export interface IEditorListener {
  onSelectionsChangedForPeerInFile(
    selections: Selection[],
    peerName: string,
    fileKey: string
  ): void;
}
