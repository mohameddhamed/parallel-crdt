import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { BASEURL } from "./constants";
import { TokenManager } from "./TokenManager";
import { authenticate } from "./Authenticate";
import { Facade } from "./facade";
import { SessionManager } from "./session/SessionManager";
import { Session } from "./session/Session";
import { Peer } from "./models/Classes";
import { IPeerConnectionListener, ISessionListener } from "./models/Interfaces";
import { TokenExpiredError } from "jsonwebtoken";

export class SidebarProvider
  implements
    vscode.WebviewViewProvider,
    ISessionListener,
    IPeerConnectionListener
{
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  private facade: Facade;
  private sessionManager: SessionManager;
  private peers: string[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    facade: Facade,
    sessionManager: SessionManager
  ) {
    this.facade = facade;
    this.sessionManager = sessionManager;
    sessionManager.registerListener(this);
  }

  onAddSession(session: Session): void {
    console.log("Sidebar Listener session listening");
    session.getPeerManager().registerListener(this);
    if (this._view) {
      console.debug("Sidebar Listener session added", session.getRoomName());
      TokenManager.setRoom(session.getRoomName());
      TokenManager.setUserName(session.getUserName());
      TokenManager.setIsOwner(session.isOwner);
      TokenManager.setPeers(
        session.getSessionPeers().map((peer) => peer.peerName)
      );

      this._view.webview.postMessage({
        type: "sessionAdded2",
        value: {
          isOwner: TokenManager.getIsOwner(),
          userName: TokenManager.getUserName(),
          roomName: TokenManager.getRoom(),
          peerNames: TokenManager.getPeers(),
        },
      });
    } else {
      console.error("Webview is not initialized");
    }
  }
  onPeerAdded(peer: Peer): void {
    if (this._view) {
      console.debug("Sidebar Listener peer added", peer.peerName);
      TokenManager.setPeer(peer.peerName);
      let peers = TokenManager.getPeers() || [];
      TokenManager.setPeers([...peers, peer.peerName]);
      this._view.webview.postMessage({
        type: "peerAdded",
        value: peer.peerName,
      });
    } else {
      console.error("Webview is not initialized");
    }
  }
  onPeerRemoved(peer: Peer): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: "peerRemoved",
        value: peer.peerName,
      });
    } else {
      console.error("Webview is not initialized");
    }
  }
  onRemoveSession(session: Session): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: "sessionRemoved",
        value: session.getRoomName(),
      });
    } else {
      console.error("Webview is not initialized");
    }
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "logout": {
          TokenManager.setToken("");
          break;
        }
        case "authenticate": {
          authenticate(() => {
            console.log("received get-token request");
            webviewView.webview.postMessage({
              type: "token",
              value: TokenManager.getToken(),
            });
          });
          break;
        }
        case "onInfo": {
          if (!data.value) {
            return;
          }
          // vscode.window.showInformationMessage(data.value);
          await this.facade.joinSession().catch(async (err) => {
            console.log("Error joining session", err);
            vscode.window.showErrorMessage("Error joining session");
            await vscode.window.showErrorMessage(err);
          });
          break;
        }
        case "get-userName": {
          console.log("received get-userName request");
          console.log(
            "posting userName request peers",
            TokenManager.getPeers()
          );
          webviewView.webview.postMessage({
            type: "userName",
            value: {
              userName: TokenManager.getUserName(),
              isOwner: TokenManager.getIsOwner(),
              roomName: TokenManager.getRoom(),
              peerNames: TokenManager.getPeers(),
            },
          });
          break;
        }
        case "get-token": {
          console.log("received get-token request");
          webviewView.webview.postMessage({
            type: "token",
            value: TokenManager.getToken(),
          });
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          // vscode.window.showErrorMessage(data.value);
          await this.facade.startSession().catch(async (err) => {
            console.log("Error starting session", err);
            vscode.window.showErrorMessage("Error starting session");
            await vscode.window.showErrorMessage(err);
          });
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content=" img-src https: data:; style-src 'unsafe-inline' ${
          webview.cspSource
        }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <script nonce="${nonce}">
          const tsvscode = acquireVsCodeApi();
          const apiBaseUrl = ${JSON.stringify(BASEURL)};
        </script>
			</head>
      <body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
