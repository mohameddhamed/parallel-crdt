import * as vscode from "vscode";
const KEY = "vstodotoken";
export class StateManager {
  static globalState: vscode.Memento;

  static getToken(): string | undefined {
    return this.globalState.get(KEY);
  }
  static setToken(token: string) {
    this.globalState.update(KEY, token);
  }
  static getPeers(): string[] | undefined {
    return this.globalState.get("peers");
  }
  static setPeers(peerNames: string[]) {
    this.globalState.update("peers", peerNames);
  }
  static getPeer(): string | undefined {
    return this.globalState.get("peer");
  }
  static setPeer(peerName: string) {
    this.globalState.update("peer", peerName);
  }
  static getUserName(): string | undefined {
    return this.globalState.get("userName");
  }
  static setUserName(userName: string) {
    this.globalState.update("userName", userName);
  }
  static getRoom(): string | undefined {
    return this.globalState.get("room");
  }
  static setRoom(roomName: string) {
    this.globalState.update("room", roomName);
  }
  static getIsOwner(): boolean | undefined {
    return this.globalState.get("owner");
  }
  static setIsOwner(isOwner: boolean) {
    this.globalState.update("owner", isOwner);
  }
}
