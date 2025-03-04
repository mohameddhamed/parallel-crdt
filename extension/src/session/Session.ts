import * as vscode from "vscode";
import { PeerConnection } from "../peer/PeerConnection";
import { Peer } from "../models/Peer";
import { FileShareManager } from "../file/FileShareManager";
import { WebsocketProvider } from "y-websocket";

export class Session {
  constructor(
    public readonly roomName: string,
    public readonly provider: WebsocketProvider,
    public readonly isOwner: boolean,

    private readonly userName: string,
    private readonly peerManager: PeerConnection,
    private readonly shareLocalFileToRemote: FileShareManager
  ) {}

  public getUserName(): string {
    return this.userName;
  }
  public getSessionPeers(): Peer[] {
    return this.peerManager.getPeers();
  }

  public getPeerManager(): PeerConnection {
    return this.peerManager;
  }
  public shareLocalFile(file: vscode.Uri): Promise<void> {
    return this.shareLocalFileToRemote.shareLocalFileToRemote(file);
  }
  public getRoomName(): string {
    return this.roomName;
  }
}

export interface ISessionListener {
  onAddSession(session: Session): void;
  onRemoveSession(session: Session): void;
}
