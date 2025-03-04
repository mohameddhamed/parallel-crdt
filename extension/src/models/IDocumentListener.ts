import { TextChange } from "./EditorStructs";

export interface IDocumentListener {
  onRemoteTextInitialized(text: string): Promise<void>;
  onRemoteTextChanged(textChanges: TextChange[]): Promise<void>;
  onDocumentSaveRequested(): Promise<void>;
}
