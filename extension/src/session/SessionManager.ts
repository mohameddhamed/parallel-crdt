import { ObservedBy } from "../ObservedBy";
import { ConnAuthenticationInfo } from "../models/ConnAuthenticationInfo";
import { Connector } from "../connection/Connector";
import { ISessionListener, Session } from "./Session";
import * as vscode from "vscode";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { PeerConnection } from "../peer/PeerConnection";
import { YjsConnection } from "../yjs/YjsConnection";
import { FileShareManager } from "../file/FileShareManager";
import { FileSystemManager } from "../file/FileSystemManager";
export class SessionManager extends ObservedBy<ISessionListener> {
  private sessions: Session[] = [];

  constructor(private connector: Connector) {
    super();
  }

  async startNewSession(isOwner: boolean = false): Promise<Session> {
    const authenticationInfo = await getSessionInfoFromUserInput();
    const sessionData = await this.connector.connect(
      authenticationInfo,
      isOwner
    );
    const session = this.getSession(sessionData);
    this.addSession(session);
    return session;
  }

  addSession(session: Session): void {
    this.sessions.push(session);
    this.notifyListeners(async (listener) => listener.onAddSession(session));
    console.debug(
      "SessionManager: addSession: session: ",
      session,
      "Listeners notified"
    );
  }

  getSessions(): Session[] {
    // Shallow copy | Encapsulation
    return this.sessions;
  }
  private getSession({
    provider,
    ydoc,
    username,
    roomName,
    isOwner,
  }: SessionData): Session {
    const peerManager = new PeerConnection();
    const yjsListener = new YjsConnection(ydoc, username, peerManager);
    const fileShareManager = new FileShareManager(
      yjsListener,
      FileSystemManager.getFileSystemManagerInstance()
    );

    yjsListener.addRemoteFileListener(fileShareManager);

    return new Session(
      roomName,
      provider,
      isOwner,
      username,
      peerManager,
      fileShareManager
    );
  }
}

async function getSessionInfoFromUserInput(): Promise<ConnAuthenticationInfo> {
  const roomName = await vscode.window.showInputBox({
    prompt: "Enter the room name",
    placeHolder: "Room name",
  });

  const username = await vscode.window.showInputBox({
    prompt: "Enter your username",
    placeHolder: "Username",
  });

  return new ConnAuthenticationInfo(username!, roomName!);
}

export type SessionData = {
  provider: WebsocketProvider;
  ydoc: Y.Doc;
  username: string;
  roomName: string;
  isOwner: boolean;
};
