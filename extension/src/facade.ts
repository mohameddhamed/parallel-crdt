import { FileManagerUtils } from "./file/FileManagerUtils";
import { SessionManager } from "./session/SessionManager";

export class Facade {
  constructor(
    private sessionManager: SessionManager,
    private fileSystemManager: FileManagerUtils
  ) {}
  async startSession(): Promise<void> {
    let workspaceFolderPath = this.fileSystemManager.getWorkspaceFolderPath();
    if (workspaceFolderPath === null) {
      return;
    }
    const session = await this.sessionManager.startNewSession(true);
    console.debug("Session started: ", session);
    await session.fileShareManager.shareLocalFilesToPeers(workspaceFolderPath);
  }

  async joinSession(): Promise<void> {
    await this.sessionManager.startNewSession(false);
  }
}
