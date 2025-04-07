import * as path from "path";
import * as dotenv from "dotenv";

// load environment variables from a .env file into the process.env object.
// path.resolve function call constructs the absolute path to the .env file by starting
// from the directory of the current file (__dirname), moving up 1 levels (..), and then appending .env.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export class Config {
  configs: Map<string, string>;
  constructor(initialConfigMap: Map<string, string> | null = null) {
    // tell when's this null
    if (initialConfigMap) {
      this.configs = initialConfigMap;
    } else {
      this.configs = new Map<string, string>();
      this.configs.set("webSocketServerUrl", process.env.WEBSOCKET_URL ?? "");
    }
  }

  getParameter(key: string): string | null {
    const param = this.configs.get(key);
    return param ?? null;
  }
  getParameterString(key: string): string {
    const param = this.getParameter(key);
    if (param) {
      return param;
    }
    throw new Error(`Parameter ${key} not found`);
  }
  getParameterNumber(key: string): number {
    return parseInt(this.getParameterString(key));
  }
}
