import { ObservedBy } from "../ObservedBy";
import { ConnAuthenticationInfo } from "../models/Classes";
import { Connector } from "../connection/Connector";
import { Session } from "./Session";
import { ISessionListener } from "../models/Interfaces";
import * as vscode from "vscode";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { PeerConnection } from "../peer/PeerConnection";
import { YFileManager } from "../file/YFileManager";
import { FileManager } from "../file/FileManager";
import { FileManagerUtils } from "../file/FileManagerUtils";
export class SessionManager extends ObservedBy<ISessionListener> {
  private sessions: Session[] = [];

  constructor(private connector: Connector) {
    super();
  }

  async logIntoSession(
    isOwner: boolean = false,
    authenticationInfo: ConnAuthenticationInfo | null = null
  ): Promise<Session> {
    if (authenticationInfo === null) {
      authenticationInfo = await getSessionInfoFromUserInput();
    }
    // const authenticationInfo = await getSessionInfoFromUserInput();
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
    const yFileManager = new YFileManager(ydoc, username, peerManager);
    const fileShareManager = new FileManager(
      yFileManager,
      FileManagerUtils.getFileShareManagerUtilsInstance()
    );

    yFileManager.addYFileManagerListener(fileShareManager);

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
