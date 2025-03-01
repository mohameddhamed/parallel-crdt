import { createEmptyFile, getWorkspaceFolderPath } from "./fileUtils";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";

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
}
