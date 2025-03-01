import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { YWebSocketConnection } from "./YWebSocketConnection";
import { ConnAuthenticationInfo, SocketProvider } from "./SocketProvider";

export class YWebSocketConnector {
  constructor(private websocketServerUrl: string) {
    this.websocketServerUrl = websocketServerUrl;
  }
  async connect(
    authenticationInfo: ConnAuthenticationInfo,
    isOwner: boolean
  ): Promise<YWebSocketConnection> {
    console.debug(`Connecting to WebSocket server 
            via ${this.websocketServerUrl} 
            to room ${authenticationInfo.roomName} 
            as username ${authenticationInfo.username}`);

    // Holds shared data that multiple users can edit simultaneously
    // Automatically handles conflict resolution
    const ydoc = new Y.Doc();

    // connect the specified url, room (session), yjs document
    // and ensure websocket functionality is available
    const provider = new WebsocketProvider(
      this.websocketServerUrl,
      authenticationInfo.roomName,
      ydoc,
      {
        WebSocketPolyfill: require("ws"),
      }
    );

    await this.awaitConnection(provider);
    console.debug(`Connected to ${authenticationInfo.roomName}`);

    return new YWebSocketConnection(
      new SocketProvider(provider),
      ydoc,
      authenticationInfo.username,
      authenticationInfo.roomName,
      isOwner
    );
  }
  private async awaitConnection(provider: WebsocketProvider): Promise<void> {
    return new Promise<void>((res, _rej) => {
      // listen for 'status' event emitted by provider
      provider.on("status", (e: { status: string }) => {
        const status = e.status;
        console.debug("status on ws debug", status);
        if (status == "connected") {
          // resolve the promise
          res();
        }
      });
    });
  }
}
