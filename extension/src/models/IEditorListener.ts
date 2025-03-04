import { Selection } from "./EditorStructs";
export interface IEditorListener {
  onSelectionsChangedForPeerInFile(
    selections: Selection[],
    peerName: string,
    fileKey: string
  ): void;
}
