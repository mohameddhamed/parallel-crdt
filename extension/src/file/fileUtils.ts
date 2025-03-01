import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function getWorkspaceFolderPath(): string | null | undefined {
  if (!vscode.workspace.workspaceFolders) {
    return null;
  }
  // REWRITE THIS
  for (const workspaceFolder of vscode.workspace.workspaceFolders) {
    return workspaceFolder.uri.fsPath;
  }
}

export function getFileKeyFromUri(uri: vscode.Uri): string {
  // vscode.Uri is used to represent file and directory paths in a way that is
  // compatible with the VS Code API.
  // It allows you to perform operations like reading, writing, and deleting files
  // using VS Code's built-in methods.
  const workspaceFolderPath = getWorkspaceFolderPath();

  let uriString = uri.fsPath;
  // get relative path
  if (workspaceFolderPath) {
    uriString = uriString.split(workspaceFolderPath)[1];
  }
  // replace backslashes with forward
  uriString = uriString.replace(/\\/g, "/");
  // remove leading slash
  if (uriString[0] === "/") {
    uriString = uriString.slice(1);
  }

  return uriString;
}

export function createEmptyFile(filePath: string): boolean {
  // check if file exists
  if (fs.existsSync(filePath)) {
    return false;
  }
  createDirectory(path.join(path.dirname(filePath)));
  // create empty file by closing immediately
  fs.createWriteStream(filePath).close();
  return true;
}

export function createDirectory(directoryPath: string): boolean {
  // check if directory exists
  if (fs.existsSync(directoryPath)) {
    return false;
  }
  fs.mkdirSync(directoryPath, { recursive: true });
  return true;
}

export async function getAllFilesInDir(dirPath: string): Promise<vscode.Uri[]> {
  const relativePattern = new vscode.RelativePattern(dirPath, "**/*");
  return vscode.workspace.findFiles(relativePattern);
}
