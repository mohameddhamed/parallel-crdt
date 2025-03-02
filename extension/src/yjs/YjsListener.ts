import { BaseObservable } from "../BaseObservable";
import { IEditorChannel } from "../editor/IEditorChannel";
import { RemoteFileListener } from "../file/ILocalRemoteFileOperations";
import { IPeerConnectionListener } from "../peer/IPeerConnectionListener";
import * as Y from "yjs";
import { PeerManager } from "../peer/PeerManager";
import { Peer } from "../peer/Peer";
import { PeerFileMap, PeerFileMapWrapper } from "../file/PeerFile";
import { EditorChannel } from "../editor/EditorChannel";
import { PeerFileFieldKeys } from "./yjsUtils";

export class YjsListener extends BaseObservable<RemoteFileListener> {
  // map peerId -> fileKey -> file
  private peers: Y.Map<Y.Map<Y.Map<unknown>>>;
  // map fileKey -> file
  private currentFiles = new Y.Map<Y.Map<unknown>>();
  private peersEditorChannels = new Map<string, Map<string, IEditorChannel>>();

  constructor(
    public doc = new Y.Doc(),
    public currentPeerName: string,
    private peerConnectionListener: PeerManager
  ) {
    super();
    this.peers = doc.getMap(PeerFileFieldKeys.peersKey);
    this.setupObservers();
  }

  private setupObservers(): void {
    this.peers.set(this.currentPeerName, this.currentFiles);
    for (const peerKey of this.peers.keys()) {
      this.addPeer(peerKey, this.peers.get(peerKey)!);
    }
    this.peers.observe(this.peerEventListener.bind(this));
  }

  private peerEventListener(
    event: Y.YMapEvent<Y.Map<Y.Map<unknown>>>,
    transaction: Y.Transaction
  ): void {
    if (transaction.origin == this.currentPeerName) {
      return;
    }
    event.changes.keys.forEach(
      (
        key: { action: "add" | "update" | "delete"; oldValue: boolean },
        peerName: string
      ) => {
        switch (key.action) {
          case "add":
            this.addPeer(peerName, this.peers.get(peerName)!);
            break;
          case "delete":
            this.deletePeer(peerName);
            break;
          default:
            break;
        }
      }
    );
  }
  private onFilesChange(
    peerName: string,
    event: Y.YMapEvent<Y.Map<unknown>>
  ): void {
    event.changes.keys.forEach((key, fileName) => {
      switch (key.action) {
        case "add":
          this.addPeerFile(
            peerName,
            fileName,
            this.peers.get(peerName)?.get(fileName)
          );
          break;
        case "delete":
          this.deletePeerFile(peerName, fileName);
          break;
        default:
          break;
      }
    });
  }

  addPeer(peerName: string, files: Y.Map<Y.Map<unknown>>): void {
    console.debug("Peer joined: " + peerName);
    if (peerName == this.currentPeerName) {
      return;
    }
    for (const fileKey of files.keys()) {
      const file = files.get(fileKey);
      if (file) {
        this.addPeerFile(peerName, fileKey, file);
      }
    }
    this.addObserversForFileList(peerName, files);
    this.peerConnectionListener.peerJoined(new Peer(peerName));
  }
  addObserversForFileList(
    peerName: string,
    files: Y.Map<Y.Map<unknown>>
  ): void {
    // COME BACK TO THIS LATER
    const fileChangeEventListener = (
      event: Y.YMapEvent<Y.Map<unknown>>,
      transaction: Y.Transaction
    ): void => {
      if (transaction.origin == this.currentPeerName) {
        return;
      }
      this.onFilesChange(peerName, event);
    };
    files.observe(fileChangeEventListener);
  }
  addRemoteFileListener(fileShareManager: RemoteFileListener): void {
    this.registerListener(fileShareManager);
  }

  deletePeerFile(peerName: string, fileKey: string): void {
    console.log("Peer: " + peerName + " deleted file: " + fileKey);
    if (!this.peersEditorChannels.has(peerName)) {
      console.error("No editor channels found for peer: " + peerName);
      return;
    }
    const files = this.peersEditorChannels.get(peerName);
    if (!files) {
      console.error("No files found for peer: " + peerName);
      return;
    }

    if (!files.has(fileKey)) {
      console.error("No file found for key: " + fileKey);
      return;
    }

    files.delete(fileKey);

    this.notifyListeners((listener) =>
      listener.onRemoteFileDeletedByPeer(fileKey)
    );

    this.currentFiles.delete(fileKey);
  }

  deleteLocalFile(fileKey: string): void {
    console.log(
      "Deleting local file: " + fileKey + "peerName: " + this.currentPeerName
    );
    if (!this.peersEditorChannels.has(this.currentPeerName)) {
      console.error(
        "No editor channels found for peer: " + this.currentPeerName
      );
      return;
    }

    let filesMap = this.peersEditorChannels.get(this.currentPeerName);
    if (!filesMap) {
      console.error("No files found for peer: " + this.currentPeerName);
      return;
    }
    if (!filesMap.has(fileKey)) {
      console.error("No file found for key: " + fileKey);
      return;
    }
    filesMap.delete(fileKey);
    this.doc.transact(() => {
      this.currentFiles.delete(fileKey);
    }, this.currentPeerName);
    this.currentFiles.delete(fileKey);
  }

  addPeerFile(
    peerName: string,
    fileKey: string,
    file: Y.Map<unknown> | undefined
  ): void {
    console.debug("Adding peer file: " + fileKey);
    if (file == undefined) {
      console.error("File is undefined");
      return;
    }
    const remoteFile = new PeerFileMapWrapper(file);
    console.log("Remote file: ", remoteFile.peerFileKey);

    if (!this.peersEditorChannels.has(peerName)) {
      this.peersEditorChannels.set(peerName, new Map<string, EditorChannel>());
    }

    let editorChannel = this.peersEditorChannels.get(peerName)!.get(fileKey);

    if (!editorChannel) {
      console.log(
        "addPeerFile: creating new editor channel for file: ",
        fileKey,
        " and peer: ",
        peerName
      );
      editorChannel = new EditorChannel(
        this.doc,
        this.currentPeerName,
        remoteFile
      );
      this.peersEditorChannels.get(peerName)!.set(fileKey, editorChannel);
    }

    const constEditorChannelReference = editorChannel;
    this.notifyListeners(async (listener) => {
      await listener.onRemoteFileAddedByPeer(
        remoteFile.peerFileKey,
        constEditorChannelReference
      );
    });
  }

  deletePeer(peerName: string): void {
    console.log("Deleting Peer: " + peerName + " form the session");
    if (!this.peersEditorChannels.has(peerName)) {
      console.error("No peer found with name: " + peerName);
      return;
    }
  }

  sendLocalFileToPeers(fileKey: string): IEditorChannel {
    console.debug("Sending local file to remote: " + fileKey);

    const remoteFile = new PeerFileMap(this.currentPeerName, fileKey);

    this.doc.transact(() => {
      this.currentFiles.set(fileKey, remoteFile);
    }, this.currentPeerName);

    if (!this.peersEditorChannels.has(this.currentPeerName)) {
      this.peersEditorChannels.set(
        this.currentPeerName,
        new Map<string, EditorChannel>()
      );
    }
    console.log(
      "sendLocalFileToRemote: creating new editor channel for file: ",
      fileKey,
      " and peer: ",
      this.currentPeerName
    );

    const editorChannel = new EditorChannel(
      this.doc,
      this.currentPeerName,
      remoteFile
    );
    this.peersEditorChannels
      .get(this.currentPeerName)!
      .set(fileKey, editorChannel);
    return editorChannel;
  }
}
