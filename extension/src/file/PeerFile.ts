import { Selection } from "vscode";
import * as Y from "yjs";
import { PeerSelection } from "../editor/EditorStructs";
import { PeerFileFieldKeys } from "../yjs/yjsUtils";
import { Peer } from "../peer/Peer";

export interface IPeerFile {
  peerName: string;
  peerFileKey: string;
  peerSelections: Y.Array<PeerSelection>;
  peerText: Y.Text;
  peerSaveRequests: Y.Array<string>;
}

export class PeerFileMap extends Y.Map<any> implements IPeerFile {
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

export class PeerFileMapWrapper implements IPeerFile {
  constructor(private yMap: Y.Map<any>) {}

  get peerName(): string {
    return this.yMap.get(PeerFileFieldKeys.peerNameKey);
  }
  set peerName(value: string) {
    this.yMap.set(PeerFileFieldKeys.peerNameKey, value);
  }
  get peerFileKey(): string {
    return this.yMap.get(PeerFileFieldKeys.peerFileKeyKey);
  }
  set peerFileKey(value: string) {
    this.yMap.set(PeerFileFieldKeys.peerFileKeyKey, value);
  }
  get peerSelections(): Y.Array<PeerSelection> {
    if (this.yMap.get(PeerFileFieldKeys.peerSelectionsKey) === undefined) {
      console.warn("get peerSelections is undefined");
    }
    return this.yMap.get(PeerFileFieldKeys.peerSelectionsKey);
  }
  set peerSelections(value: Y.Array<PeerSelection>) {
    if (value === undefined) {
      console.warn("set peerSelections is undefined");
    }
    this.yMap.set(PeerFileFieldKeys.peerSelectionsKey, value);
  }
  get peerText(): Y.Text {
    return this.yMap.get(PeerFileFieldKeys.peerTextKey);
  }
  set peerText(value: Y.Text) {
    this.yMap.set(PeerFileFieldKeys.peerTextKey, value);
  }
  get peerSaveRequests(): Y.Array<string> {
    return this.yMap.get(PeerFileFieldKeys.peerSaveRequestsKey);
  }
  set peerSaveRequests(value: Y.Array<string>) {
    this.yMap.set(PeerFileFieldKeys.peerSaveRequestsKey, value);
  }
}
