import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { BASEURL } from "./constants";
import { StateManager } from "./StateManager";
import { authenticate } from "./Authenticate";
import { Facade } from "./facade";
import { SessionManager } from "./session/SessionManager";
import { Session } from "./session/Session";
import { Peer, TextChangeType } from "./models/Classes";
import { IPeerConnectionListener, ISessionListener } from "./models/Interfaces";
import { getFileKeyFromUri } from "./models/Utils";

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
      StateManager.setRoom(session.getRoomName());
      StateManager.setUserName(session.getUserName());
      StateManager.setIsOwner(session.isOwner);
      StateManager.setPeers(
        session.getSessionPeers().map((peer) => peer.peerName)
      );

      this._view.webview.postMessage({
        type: "sessionAdded2",
        value: {
          isOwner: StateManager.getIsOwner(),
          userName: StateManager.getUserName(),
          roomName: StateManager.getRoom(),
          peerNames: StateManager.getPeers(),
        },
      });
    } else {
      console.error("Webview is not initialized");
    }
  }
  onPeerAdded(peer: Peer): void {
    if (this._view) {
      console.debug("Sidebar Listener peer added", peer.peerName);
      // StateManager.setPeer(peer.peerName);
      let peers = StateManager.getPeers() || [];
      StateManager.setPeers([...peers, peer.peerName]);
      console.debug("posting peerAdded request peers", StateManager.getPeers());
      this._view.webview.postMessage({
        type: "peerAdded",
        value: peer.peerName,
      });
    } else {
      console.error("Webview is not initialized");
    }
  }
  onPeerLeft(peerName: string): void {
    console.debug("Sidebar Listener peer left", peerName);
    if (this._view) {
      this._view.webview.postMessage({
        type: "sessionRemoved",
        value: peerName,
      });
    } else {
      console.error("Webview is not initialized");
    }
  }
  onSessionRemoved(session: Session): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: "sessionRemoved",
        value: session.getSessionPeers().length,
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
          StateManager.setToken("");
          break;
        }
        case "authenticate": {
          authenticate(() => {
            console.log("received get-token request");
            webviewView.webview.postMessage({
              type: "token",
              value: StateManager.getToken(),
            });
          });
          break;
        }
        case "end-session": {
          console.log("received end-session request 0");
          // vscode.window.showInformationMessage(data.value);
          console.log("received end-session request 1");
          await this.facade.endSession().catch(async (err) => {
            console.log("Error ending session", err);
            vscode.window.showErrorMessage("Error ending session");
            await vscode.window.showErrorMessage(err);
          });
          break;
        }
        case "start-session": {
          if (!data.value) {
            return;
          }
          // vscode.window.showInformationMessage(data.value);
          let user = data.value.user;
          let room = data.value.room;
          let isOwner = data.value.isOwner;
          let password = data.value.password;
          let ipAddress = data.value.ipAddress;
          console.log(
            "received start-session request",
            user,
            room,
            isOwner,
            password,
            ipAddress
          );
          if (isOwner === true) {
            await this.facade
              .startSession(user, room, password, ipAddress)
              .catch(async (err) => {
                console.log("Error starting session", err);
                vscode.window.showErrorMessage("Error starting session");
                await vscode.window.showErrorMessage(err);
              });
          } else {
            await this.facade
              .joinSession(user, room, password, ipAddress)
              .catch(async (err) => {
                console.log("Error joining session", err);
                vscode.window.showErrorMessage("Error joining session");
                await vscode.window.showErrorMessage(err);
              });
          }
          break;
        }
        case "get-userName": {
          console.log("received get-userName request");
          let thePeerNames =
            this.sessionManager
              .getSessions()[0]
              ?.getSessionPeers()
              .map((peer) => peer.peerName) || [];
          console.log("posting userName request peers", thePeerNames);
          webviewView.webview.postMessage({
            type: "userName",
            value: {
              userName: StateManager.getUserName(),
              isOwner: StateManager.getIsOwner(),
              roomName: StateManager.getRoom(),
              peerNames: thePeerNames,
            },
          });
          break;
        }
        case "get-token": {
          console.log("received get-token request");
          webviewView.webview.postMessage({
            type: "token",
            value: StateManager.getToken(),
          });
          break;
        }
        case "getPeerChanges": {
          const peerName = data.value;
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor) {
            const uri = activeEditor.document.uri;
            const fileKey = getFileKeyFromUri(uri); // Define this helper function
            const session = this.sessionManager.getSessions()[0]; // Assuming one session
            if (session) {
              const storeFile =
                session.fileManager.fileStore.getFileByKeyFromStore(fileKey);
              if (storeFile) {
                const document = storeFile.editorChannel.getDocument();
                const changes = document.getChangesByPeer(peerName);
                console.debug(
                  "Sidebar Listener getPeerChanges: peer: ",
                  peerName,
                  " changes: ",
                  changes
                );
                const insertions = changes.filter(
                  (c) => c.type === TextChangeType.INSERT
                ).length;
                const deletions = changes.filter(
                  (c) => c.type === TextChangeType.DELETE
                ).length;
                webviewView.webview.postMessage({
                  type: "peerChanges",
                  value: { peerName, insertions, deletions },
                });
              } else {
                console.warn("No StoreFile found for key:", fileKey);
              }
            } else {
              console.warn("No active session");
            }
          } else {
            console.warn("No active text editor");
          }
          break;
        }
        case "revertChanges": {
          // Simulate actual Ctrl+Z keystroke
          try {
            await vscode.commands.executeCommand(
              "workbench.action.focusActiveEditorGroup"
            );
            await vscode.commands.executeCommand("undo");
          } catch (error) {
            console.error("Undo failed:", error);
          }
          break;
        }
        case "revertPeerChanges": {
          const peerName = data.value;
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor) {
            const uri = activeEditor.document.uri;
            const fileKey = getFileKeyFromUri(uri); // Define this helper function
            const session = this.sessionManager.getSessions()[0]; // Assuming one session
            if (session) {
              const storeFile =
                session.fileManager.fileStore.getFileByKeyFromStore(fileKey);
              if (storeFile) {
                const document = storeFile.editorChannel.getDocument();
                // document.revertChangesByPeer(peerName);
                const [insertCount, deleteCount] =
                  document.getNumberOfChangesByPeer(peerName);
                vscode.window.showInformationMessage(
                  `${peerName} has made ${insertCount} insertions and ${deleteCount} deletions`
                );
              } else {
                console.warn("No StoreFile found for key:", fileKey);
              }
            } else {
              console.warn("No active session");
            }
          } else {
            console.warn("No active text editor");
          }
          break;
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
