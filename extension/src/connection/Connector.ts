import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { ConnAuthenticationInfo } from "../models/Classes";
import { SessionData } from "../session/SessionManager";
import { Session } from "../session/Session";
import { computeEffectiveRoomName } from "../models/Utils";

export class Connector {
  constructor(private websocketServerUrl: string) {
    this.websocketServerUrl = websocketServerUrl;
  }
  async connect(
    authenticationInfo: ConnAuthenticationInfo,
    isOwner: boolean,
    ipAddress: string
  ): Promise<SessionData> {
    let connectionUrl = "ws://" + ipAddress + ":1234";
    console.debug(`Connecting to WebSocket server 
            via ${connectionUrl} 
            to room ${authenticationInfo.roomName} 
            as username ${authenticationInfo.username}`);

    // Compute the effective room name using room name and password
    const effectiveRoomName = computeEffectiveRoomName(
      authenticationInfo.roomName,
      authenticationInfo.password
    );

    // Holds shared data that multiple users can edit simultaneously
    const ydoc = new Y.Doc();

    // Connect using the effective room name
    const provider = new WebsocketProvider(
      connectionUrl,
      effectiveRoomName, // Use the hashed room name
      ydoc,
      {
        WebSocketPolyfill: require("ws"),
      }
    );

    await this.awaitConnection(provider);
    console.debug(
      `Connected to ${authenticationInfo.roomName} (effective: ${effectiveRoomName})`
    );

    return {
      provider,
      ydoc,
      username: authenticationInfo.username,
      roomName: authenticationInfo.roomName, // Original room name for display
      isOwner,
    };
  }

  /**
   * Disconnect from a session by cleaning up the WebSocket provider and Y.Doc
   * @param session The session data containing provider and document to disconnect
   * @returns A promise that resolves when disconnection is complete
   */
  async disconnect(session: Session): Promise<void> {
    try {
      console.debug(
        `Disconnecting from room ${
          session.roomName
        } as ${session.getUserName()} who is ${
          session.isOwner ? "owner" : "not owner"
        }`
      );

      // Remove the peer's entry from the peers map to signal departure
      session.fileManager.yFileManager.disconnect();

      // Disconnect the WebSocket provider
      if (session.provider) {
        // Unsubscribe from any events first
        session.provider.off("status", () => {});

        // Disconnect the provider
        session.provider.disconnect();

        // Destroy the provider (remove references)
        session.provider.destroy();

        console.debug(`WebSocket provider disconnected`);
      }

      // Destroy the Y.Doc to free up resources
      // if (session.ydoc) {
      //   session.ydoc.destroy();
      //   console.debug(`Y.Doc destroyed`);
      // }

      console.debug(`Successfully disconnected from room ${session.roomName}`);
    } catch (error) {
      console.error(`Error during disconnection: ${error}`);
      throw error;
    }
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
