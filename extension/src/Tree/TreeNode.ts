import * as vscode from "vscode";
import { Peer } from "../peer/Peer";
import { Session } from "../session/Session";
// type alias
export type TreeNode = vscode.TreeItem;

//                                                    // redundant
export class SessionsTreeNode extends vscode.TreeItem implements TreeNode {
  constructor(hasConnections: boolean) {
    const state = hasConnections
      ? vscode.TreeItemCollapsibleState.Expanded
      : vscode.TreeItemCollapsibleState.None;
    super("Sessions", state);
    this.contextValue = "sessions";
  }
}

export class PeerTreeNode extends vscode.TreeItem implements TreeNode {
  constructor(peer: Peer) {
    super(peer.peerName);
    this.contextValue = "peer";
  }
}

export class SessionTreeNode extends vscode.TreeItem implements TreeNode {
  constructor(public session: Session) {
    const state = session.getSessionPeers().length
      ? vscode.TreeItemCollapsibleState.Expanded
      : vscode.TreeItemCollapsibleState.None;
    super(session.getRoomName(), state);
    this.contextValue = "session";
  }
}
