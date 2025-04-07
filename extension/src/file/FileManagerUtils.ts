import {
  createEmptyFile,
  getAllFilesInDir,
  getWorkspaceFolderPath,
} from "../models/Utils";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { Session } from "../session/Session";

export class FileManagerUtils {
  private static instance: FileManagerUtils;
  public workspaceFolderPath: string;

  constructor() {
    const workspaceFolderPath = getWorkspaceFolderPath();
    if (!workspaceFolderPath) {
      throw new Error("Open a workspace to use this extension");
    }
    this.workspaceFolderPath = workspaceFolderPath;
  }

  public static getFileShareManagerUtilsInstance(): FileManagerUtils {
    if (!this.instance) {
      this.instance = new FileManagerUtils();
    }
    return FileManagerUtils.instance;
  }

  public getUriOfFile(fileName: string): vscode.Uri {
    const fullPathToFile = path.join(this.workspaceFolderPath, fileName);
    return vscode.Uri.file(fullPathToFile);
  }

  public addFileLocally(fileName: string): vscode.Uri | null {
    const fullPathToFile = path.join(this.workspaceFolderPath, fileName);
    if (!createEmptyFile(fullPathToFile)) {
      console.log(
        "Create Empty File error: File already exists: ",
        fullPathToFile
      );
      return null;
    }
    return vscode.Uri.file(fullPathToFile);
  }

  public deleteFileLocally(file: vscode.Uri): void {
    const fullPathToFile = file.fsPath;
    fs.unlinkSync(fullPathToFile);
  }

  public getWorkspaceFolderPath(): string {
    return this.workspaceFolderPath;
  }
}
