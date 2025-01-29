import * as vscode from 'vscode'
const KEY = 'vstodotoken'
export class TokenManager {
    static globalState : vscode.Memento;

    static getToken() : string | undefined {
        return this.globalState.get(KEY);
    }
    static setToken(token: string) {
        this.globalState.update(KEY, token)
    }
}