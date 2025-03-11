import * as vscode from "vscode";
const KEY = "vstodotoken";
export class TokenManager {
  static globalState: vscode.Memento;

  static getToken(): string | undefined {
    return this.globalState.get(KEY);
  }
  static setToken(token: string) {
    this.globalState.update(KEY, token);
  }
  static getPeer(): string | undefined {
    return this.globalState.get("peer");
  }
  static setPeer(peerName: string) {
    this.globalState.update("peer", peerName);
  }
  static getRoom(): string | undefined {
    return this.globalState.get("room");
  }
  static setRoom(roomName: string) {
    this.globalState.update("room", roomName);
  }
}
