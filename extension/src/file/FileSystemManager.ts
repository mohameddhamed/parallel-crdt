import {
  createEmptyFile,
  getAllFilesInDir,
  getWorkspaceFolderPath,
} from "./fileUtils";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { Session } from "../session/Session";

export class FileSystemManager {
  private static instance: FileSystemManager;
  public workspaceFolderPath: string;

  constructor() {
    const workspaceFolderPath = getWorkspaceFolderPath();
    if (!workspaceFolderPath) {
      throw new Error("Open a workspace to use this extension");
    }
    this.workspaceFolderPath = workspaceFolderPath;
  }

  public static getFileSystemManagerInstance(): FileSystemManager {
    if (!this.instance) {
      this.instance = new FileSystemManager();
    }
    return FileSystemManager.instance;
  }

  public getUriOfFile(fileName: string): vscode.Uri {
    const fullPathToFile = path.join(this.workspaceFolderPath, fileName);
    return vscode.Uri.file(fullPathToFile);
  }

  public addFileToWorkspace(fileName: string): vscode.Uri | null {
    const fullPathToFile = path.join(this.workspaceFolderPath, fileName);
    if (!createEmptyFile(fullPathToFile)) {
      return null;
    }
    return vscode.Uri.file(fullPathToFile);
  }

  public deleteFile(file: vscode.Uri): void {
    const fullPathToFile = file.fsPath;
    fs.unlinkSync(fullPathToFile);
  }

  public getWorkspaceFolderPath(): string {
    return this.workspaceFolderPath;
  }

  async shareWorkspaceFilesToSessionPeers(session: Session): Promise<void> {
    // Share all files in the workspace
    if (!this.workspaceFolderPath) {
      console.error("Workspace path is not set");
      return;
    }
    // Get all files in the workspace
    const workspaceFiles = await getAllFilesInDir(this.workspaceFolderPath);
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
}
