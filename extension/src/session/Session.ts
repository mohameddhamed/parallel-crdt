import * as vscode from "vscode";
import { SocketProvider } from "../connection/SocketProvider";
import { PeerManager } from "../peer/PeerManager";
import { ILocalRemoteFileOperations } from "../file/ILocalRemoteFileOperations";
import { Peer } from "../peer/Peer";

export class Session {
  constructor(
    public readonly roomName: string,
    public readonly provider: SocketProvider,
    public readonly isOwner: boolean,

    private readonly userName: string,
    private readonly peerManager: PeerManager,
    private readonly shareLocalFileToRemote: ILocalRemoteFileOperations
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
