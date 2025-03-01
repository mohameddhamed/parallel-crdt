import { Awareness } from "y-protocols/awareness";
import { WebsocketProvider } from "y-websocket";

export class SocketProvider {
  constructor(private provider: WebsocketProvider) {}
  getAwareness(): Awareness {
    return this.provider.awareness;
  }
  getProvider(): WebsocketProvider {
    return this.provider;
  }
}

export class ConnAuthenticationInfo {
  constructor(
    public username: string,
    public roomName: string,
    public password: string | null = null
  ) {}
}
