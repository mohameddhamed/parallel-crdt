import { Config } from "./Config";
import { FileSystemManager } from "./file/FileSystemManager";
import { getAllFilesInDir } from "./file/fileUtils";
import { Session } from "./session/Session";
import { SessionManager } from "./session/SessionManager";

export class Facade {
  constructor(
    private sessionManager: SessionManager,
    private fileSystemManager: FileSystemManager
  ) {}
  async startSession(): Promise<void> {
    if (!this.fileSystemManager.getWorkspaceFolderPath()) {
      return;
    }
    const session = await this.sessionManager.startNewSession(true);
    console.debug("Session started: ", session);
    await this.fileSystemManager.shareWorkspaceFilesToSessionPeers(session);
  }

  async joinSession(): Promise<void> {
    await this.sessionManager.startNewSession(false);
  }
}
