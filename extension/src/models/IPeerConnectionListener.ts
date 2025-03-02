import { Peer } from "./Peer";

export interface IPeerConnectionListener {
  onPeerAdded(peer: Peer): void;
  onPeerRemoved(peer: Peer): void;
}
