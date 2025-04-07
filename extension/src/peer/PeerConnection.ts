import { ObservedBy } from "../ObservedBy";
import { Peer } from "../models/Classes";
import { IPeerConnectionListener } from "../models/Interfaces";

export class PeerConnection extends ObservedBy<IPeerConnectionListener> {
  private peers: Peer[] = [];

  peerJoined(peer: Peer): void {
    console.log("peer joined: " + peer.peerName);
    this.peers.push(peer);
    this.notifyListeners(
      async (listener: IPeerConnectionListener): Promise<void> =>
        listener.onPeerAdded(peer)
    );
  }

  peerLeft(peerName: string): void {
    console.log("peer left: " + peerName);
    const index = this.peers.findIndex((peer) => peer.peerName === peerName);
    if (index > -1) {
      this.peers.splice(index, 1);
    }
    console.debug("before peers: ", this.peers);
    this.peers.pop();
    console.debug("after peers: ", this.peers);
    this.notifyListeners(async (listener) => listener.onPeerLeft(peerName));
  }

  getPeers(): Peer[] {
    // Shallow copy | Encapsulation
    return this.peers.slice();
  }
}
