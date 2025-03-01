import { Config } from "../Config";
import { YWebSocketConnector } from "./YWebSocketConnector";

export class ConnectionManager {
  private connector: YWebSocketConnector;

  constructor(private config: Config) {
    this.connector = new YWebSocketConnector(
      this.config.getParameterString("webSocketServerUrl")
    );
  }

  getConnector(): YWebSocketConnector {
    return this.connector;
  }
}
