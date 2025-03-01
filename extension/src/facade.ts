import { Config } from "./Config";
import { FileAndWorskspaceSharer } from "./file/FileAndWorkspaceSharer";
import { SessionManager } from "./session/SessionManager";

export class Facade {
  constructor(
    private sessionManager: SessionManager,
    private fileSharer: FileAndWorskspaceSharer
  ) {}
  async startSession(): Promise<void> {
    if (!this.fileSharer.workspacePath) {
      return;
    }
    const session = await this.sessionManager.startNewSession(true);
    console.debug("Session started: ", session);
    await this.fileSharer.shareWorkspaceFilesToSessionPeers(session);
  }

  async joinSession(): Promise<void> {
    await this.sessionManager.startNewSession(false);
  }
}
