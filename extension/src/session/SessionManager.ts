import { BaseObservable } from "../BaseObservable";
import { ConnAuthenticationInfo } from "../connection/SocketProvider";
import { YWebSocketConnector } from "../connection/YWebSocketConnector";
import { ISessionListener, Session } from "./Session";
import * as vscode from "vscode";

export class SessionManager extends BaseObservable<ISessionListener> {
  private sessions: Session[] = [];

  constructor(private connector: YWebSocketConnector) {
    super();
  }

  async startNewSession(isOwner: boolean = false): Promise<Session> {
    const authenticationInfo = await getSessionInfoFromUserInput();
    const connection = await this.connector.connect(
      authenticationInfo,
      isOwner
    );
    const session = connection.getSession();
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
