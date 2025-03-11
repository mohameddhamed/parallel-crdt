import * as vscode from "vscode";
import {
  PeerTreeNode,
  SessionsTreeNode,
  SessionTreeNode,
  TreeNode,
} from "./TreeNode";
import { Session } from "../session/Session";
import {
  ISessionListener,
  IPeerConnectionListener,
} from "../models/Interfaces";
import { SessionManager } from "../session/SessionManager";
import { Peer } from "../models/Classes";
type EmittedEventType = void | TreeNode | TreeNode[] | null | undefined;

export class SessionTreeDataProvider
  implements
    vscode.TreeDataProvider<TreeNode>,
    ISessionListener,
    IPeerConnectionListener
{
  onDidChangeTreeDataEventEmitter = new vscode.EventEmitter<EmittedEventType>();
  constructor(private sessionManager: SessionManager) {}

  onPeerAdded(peer: Peer): void {
    this.onDidChangeTreeDataEventEmitter.fire();
  }

  onPeerRemoved(peer: Peer): void {
    this.onDidChangeTreeDataEventEmitter.fire();
  }

  onAddSession(session: Session): void {
    session.getPeerManager().registerListener(this);
    this.onDidChangeTreeDataEventEmitter.fire();
  }

  onRemoveSession(session: Session): void {
    this.onDidChangeTreeDataEventEmitter.fire();
  }

  onDidChangeTreeData: vscode.Event<EmittedEventType> =
    this.onDidChangeTreeDataEventEmitter.event;

  getTreeItem(element: TreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: TreeNode): vscode.ProviderResult<TreeNode[]> {
    let result: TreeNode[] = [];
    if (!element) {
      result.push(
        new SessionsTreeNode(this.sessionManager.getSessions().length > 0)
      );
      return Promise.resolve(result);
    }
    if (element instanceof SessionsTreeNode) {
      result = this.getSessions();
    } else if (element instanceof SessionTreeNode) {
      result = this.getPeers(element.session);
    }
    return Promise.resolve(result);
  }

  private getPeers(session: Session): TreeNode[] {
    return session
      .getSessionPeers()
      .map((peer: Peer) => new PeerTreeNode(peer));
  }

  private getSessions(): TreeNode[] {
    return this.sessionManager
      .getSessions()
      .map((session: Session) => new SessionTreeNode(session));
  }
}
