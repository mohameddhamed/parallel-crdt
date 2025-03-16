import { FileManagerUtils } from "./file/FileManagerUtils";
import { ConnAuthenticationInfo } from "./models/Classes";
import { Session } from "./session/Session";
import { SessionManager } from "./session/SessionManager";

export class Facade {
  constructor(
    private sessionManager: SessionManager,
    private fileSystemManager: FileManagerUtils
  ) {}
  async startSession(
    username: string | null = null,
    room: string | null = null
  ): Promise<void> {
    let workspaceFolderPath = this.fileSystemManager.getWorkspaceFolderPath();
    if (workspaceFolderPath === null) {
      return;
    }
    let session: Session;

    if (username != null && room != null) {
      const authenticationInfo = new ConnAuthenticationInfo(username, room);
      session = await this.sessionManager.logIntoSession(
        true,
        authenticationInfo
      );
    } else {
      session = await this.sessionManager.logIntoSession(true);
    }
    console.debug("Session started: ", session);
    await session.fileShareManager.shareLocalFilesToPeers(workspaceFolderPath);
  }

  // TODO: session array to session instance
  async endSession(): Promise<void> {
    let session = this.sessionManager.getSessions()[0];
    await this.sessionManager.endSession(session);
  }

  async joinSession(
    username: string | null = null,
    room: string | null = null
  ): Promise<void> {
    if (username != null && room != null) {
      const authenticationInfo = new ConnAuthenticationInfo(username, room);
      await this.sessionManager.logIntoSession(false, authenticationInfo);
    } else {
      await this.sessionManager.logIntoSession(false);
    }
  }
}
