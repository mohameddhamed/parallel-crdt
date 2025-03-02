import { TextChange } from "./EditorStructs";

export interface IDocumentChannel {
  addDocumentListener(listener: IDocumentChannelListener): void;
  sendLocalTextChangesToRemote(textChanges: TextChange[]): void;
  transactAndApplyTextChange(textChange: TextChange): void;
  sendSaveRequestToPeers(): void;
}

export interface IDocumentChannelListener {
  onRemoteTextInitialized(text: string): Promise<void>;
  onRemoteTextChanged(textChanges: TextChange[]): Promise<void>;
  onDocumentSaveRequested(): Promise<void>;
}
