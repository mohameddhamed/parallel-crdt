import * as vscode from "vscode";
import { PeerConnection } from "../peer/PeerConnection";
import { Peer } from "../models/Classes";
import { FileManager } from "../file/FileManager";
import { WebsocketProvider } from "y-websocket";

export class Session {
  constructor(
    public readonly roomName: string,
    public readonly provider: WebsocketProvider,
    public readonly isOwner: boolean,

    private readonly userName: string,
    private readonly peerManager: PeerConnection,
    public readonly fileShareManager: FileManager
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
    return this.fileShareManager.shareLocalFileToPeers(file);
  }
  public getRoomName(): string {
    return this.roomName;
  }
}
