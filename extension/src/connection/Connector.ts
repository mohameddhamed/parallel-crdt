import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { ConnAuthenticationInfo } from "../models/Classes";
import { SessionData } from "../session/SessionManager";
import { Session } from "../session/Session";

export class Connector {
  constructor(private websocketServerUrl: string) {
    this.websocketServerUrl = websocketServerUrl;
  }
  async connect(
    authenticationInfo: ConnAuthenticationInfo,
    isOwner: boolean
  ): Promise<SessionData> {
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

    return {
      provider,
      ydoc,
      username: authenticationInfo.username,
      roomName: authenticationInfo.roomName,
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
