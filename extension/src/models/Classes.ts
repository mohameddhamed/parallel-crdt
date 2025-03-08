import * as vscode from "vscode";
import * as Y from "yjs";

export class ConnAuthenticationInfo {
  constructor(
    public username: string,
    public roomName: string,
    public password: string | null = null
  ) {}
}
export class Position {
  constructor(public row: number, public column: number) {}
}

export class Selection {
  constructor(
    public id: string,
    public reversed: boolean,
    public isCursor: boolean,
    public start: Position,
    public end: Position
  ) {}
}

export enum TextChangeType {
  INSERT,
  DELETE,
  UPDATE,
}

export class TextChange {
  constructor(
    public type: TextChangeType,
    public start: Position,
    public end: Position,
    public text: string
  ) {}
}

export class PeerSelection {
  constructor(public peerName: string, public selection: Selection) {}
}

export class Peer {
  constructor(public peerName: string) {}
}

export class PeerFileMap extends Y.Map<any> {
  constructor(
    peerName: string,
    fileKey: string,
    initialFileText: string | null = null
  ) {
    super();
    this.peerName = peerName;
    this.peerFileKey = fileKey;
    this.peerSelections = new Y.Array<PeerSelection>();
    this.peerSaveRequests = new Y.Array<string>();
    if (initialFileText) {
      this.peerText = new Y.Text(initialFileText);
    } else {
      this.peerText = new Y.Text();
    }
  }

  public get peerName(): string {
    return this.get(PeerFileFieldKeys.peerNameKey);
  }
  public set peerName(value: string) {
    this.set(PeerFileFieldKeys.peerNameKey, value);
  }

  public get peerFileKey(): string {
    return this.get(PeerFileFieldKeys.peerFileKeyKey);
  }
  public set peerFileKey(value: string) {
    this.set(PeerFileFieldKeys.peerFileKeyKey, value);
  }
  public get peerSelections(): Y.Array<PeerSelection> {
    const peerSelections = this.get(PeerFileFieldKeys.peerSelectionsKey);
    if (peerSelections === undefined) {
      console.warn("peerSelections is undefined");
    }
    return peerSelections;
  }
  public set peerSelections(value: Y.Array<PeerSelection>) {
    if (value === undefined) {
      console.warn("peerSelections is undefined");
    }
    this.set(PeerFileFieldKeys.peerSelectionsKey, value);
  }

  public get peerText(): Y.Text {
    return this.get(PeerFileFieldKeys.peerTextKey);
  }
  public set peerText(value: Y.Text) {
    this.set(PeerFileFieldKeys.peerTextKey, value);
  }

  public get peerSaveRequests(): Y.Array<string> {
    return this.get(PeerFileFieldKeys.peerSaveRequestsKey);
  }
  public set peerSaveRequests(value: Y.Array<string>) {
    this.set(PeerFileFieldKeys.peerSaveRequestsKey, value);
  }
}

export class PeerEditorDecorator {
  constructor(
    public selectionDecoration: vscode.TextEditorDecorationType,
    public cursorDecoration: vscode.TextEditorDecorationType,
    public nameDecoration: vscode.TextEditorDecorationType
  ) {}
}

export class PeerFileFieldKeys {
  public static readonly peersKey = "peers";
  public static readonly peerNameKey = "peerName";
  public static readonly peerFileKeyKey = "peerfileKey";
  public static readonly peerSelectionsKey = "peerSelections";
  public static readonly peerTextKey = "peerText";
  public static readonly peerSaveRequestsKey = "peerSaveRequests";
}
