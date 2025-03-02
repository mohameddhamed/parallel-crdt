import * as vscode from "vscode";
import { SocketProvider } from "../connection/SocketProvider";
import { PeerManager } from "../peer/PeerManager";
import { Peer } from "../peer/Peer";
import { FileShareManager } from "../file/FileShareManager";

export class Session {
  constructor(
    public readonly roomName: string,
    public readonly provider: SocketProvider,
    public readonly isOwner: boolean,

    private readonly userName: string,
    private readonly peerManager: PeerManager,
    private readonly shareLocalFileToRemote: FileShareManager
  ) {}

  public getUserName(): string {
    return this.userName;
  }
  public getSessionPeers(): Peer[] {
    return this.peerManager.getPeers();
  }

  public getPeerManager(): PeerManager {
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
