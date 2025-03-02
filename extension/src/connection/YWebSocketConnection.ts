import { Doc } from "yjs";
import { SocketProvider } from "../models/SocketProvider";
import { Session } from "../session/Session";
import { PeerManager } from "../peer/PeerManager";
import { FileSystemManager } from "../file/FileSystemManager";
import { FileShareManager } from "../file/FileShareManager";
import { YjsListener } from "../yjs/YjsListener";

export class YWebSocketConnection {
  private readonly session: Session;
  constructor(
    private provider: SocketProvider,
    private ydoc: Doc,
    private username: string,
    private roomName: string,
    private isOwner: boolean
  ) {
    this.session = this.createNewSession();
  }

  private createNewSession(): Session {
    const peerManager = new PeerManager();
    const yjsListener = new YjsListener(this.ydoc, this.username, peerManager);
    const fileShareManager = new FileShareManager(
      yjsListener,
      FileSystemManager.getFileSystemManagerInstance()
    );

    yjsListener.addRemoteFileListener(fileShareManager);

    return new Session(
      this.roomName,
      this.provider,
      this.isOwner,
      this.username,
      peerManager,
      fileShareManager
    );
  }

  getSession(): Session {
    return this.session;
  }
}
