import { IDocumentChannel } from "../document/IDocumentChannel";
import { Peer } from "../peer/Peer";
import { Selection } from "./EditorStructs";

export interface IEditorChannel {
  addEditorChannelListener(listener: IEditorChannelListener): void;
  getDocumentChannel(): IDocumentChannel;
  sendLocalSelectionsToRemote(selections: Selection[]): void;
}

export interface IEditorChannelListener {
  onSelectionsChangedForPeerInFile(
    selections: Selection[],
    peerName: string,
    fileKey: string
  ): void;
}
