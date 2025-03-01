import { BaseObservable } from "../BaseObservable";
import { Peer } from "./Peer";
import { IPeerConnectionListener } from "./IPeerConnectionListener";

export class PeerManager extends BaseObservable<IPeerConnectionListener> {
  private peers: Peer[] = [];

  peerJoined(peer: Peer): void {
    console.log("peer joined: " + peer.peerName);
    this.peers.push(peer);
    this.notifyListeners(
      async (listener: IPeerConnectionListener): Promise<void> =>
        listener.onPeerAdded(peer)
    );
  }

  peerLeft(peer: Peer): void {
    console.log("peer left: " + peer.peerName);
    const index = this.peers.indexOf(peer);
    if (index > -1) {
      this.peers.splice(index, 1);
    }
    this.notifyListeners(async (listener) => listener.onPeerRemoved(peer));
  }

  getPeers(): Peer[] {
    // Shallow copy | Encapsulation
    return this.peers.slice();
  }
}
