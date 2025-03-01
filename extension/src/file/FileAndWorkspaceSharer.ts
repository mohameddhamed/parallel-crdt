import { Session } from "../session/Session";
import { getAllFilesInDir } from "./fileUtils";
import * as vscode from "vscode";

export class FileAndWorskspaceSharer {
  constructor(public workspacePath: string | null | undefined) {}
  async shareWorkspaceFilesToSessionPeers(session: Session): Promise<void> {
    // Share all files in the workspace
    if (!this.workspacePath) {
      console.error("Workspace path is not set");
      return;
    }
    // Get all files in the workspace
    const workspaceFiles = await getAllFilesInDir(this.workspacePath);
    console.log("Sharing all files in the workspace: ", workspaceFiles);
    // Share each file
    for (const file of workspaceFiles) {
      try {
        await session.shareLocalFile(file);
      } catch (e) {
        console.error("Error sharing file: ", e, file);
      }
    }
  }
  async shareLocalFile(session: Session, fileUri: vscode.Uri): Promise<void> {
    try {
      await session.shareLocalFile(fileUri);
    } catch (e) {
      console.error("Error sharing file: ", e, fileUri);
    }
  }
}
