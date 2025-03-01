import * as vscode from "vscode";
import { getRandomColor } from "./editorUtils";

class PeerEditorDecorator {
  constructor(
    public selectionDecoration: vscode.TextEditorDecorationType,
    public cursorDecoration: vscode.TextEditorDecorationType,
    public nameDecoration: vscode.TextEditorDecorationType
  ) {}
}

export class PeerEditorDecoratorStore {
  // to prevent 2 peers from having the same decorator
  private static instance: PeerEditorDecoratorStore;
  static getInstance(): PeerEditorDecoratorStore {
    if (!PeerEditorDecoratorStore.instance) {
      PeerEditorDecoratorStore.instance = new PeerEditorDecoratorStore();
    }
    return PeerEditorDecoratorStore.instance;
  }

  private peerEditorDecorators: Map<string, PeerEditorDecorator> = new Map();
  getPeerDecorator(peerName: string): PeerEditorDecorator {
    let peerEditorDecorator = this.peerEditorDecorators.get(peerName);
    if (peerEditorDecorator) {
      return peerEditorDecorator;
    }
    const peerEditorColor = getRandomColor();

    const selectionDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: peerEditorColor,
    });

    const cursorDecoration = vscode.window.createTextEditorDecorationType({
      border: `solid ${peerEditorColor}`,
      borderWidth: "7px 1px 7px 1px",
    });

    const nameDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: peerName,
        color: "rgba(0, 0, 0, 1)",
        fontWeight: "bold",
        backgroundColor: peerEditorColor,
        fontStyle: "italic",
        margin: `0 0 0 -${peerName.length}ch`,
        width: `${peerName.length}ch; position: absolute; z-index: 99;`,
      },
    });

    peerEditorDecorator = new PeerEditorDecorator(
      selectionDecoration,
      cursorDecoration,
      nameDecoration
    );
    this.peerEditorDecorators.set(peerName, peerEditorDecorator);
    return peerEditorDecorator;
  }
}
