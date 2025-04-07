import * as vscode from "vscode";
import { BASEURL } from "./constants";
import * as polka from "polka";
import { StateManager } from "./StateManager";
import * as jwt from "jsonwebtoken";

export const authenticate = (fn: () => void) => {
  const app = polka();

  app.get("auth/:token", async (req, res) => {
    const { token } = req.params;
    if (!token) {
      res.end("Error occurred during auth");
      return;
    }
    await StateManager.setToken(token);
    fn();

    res.end(`<h1> You have successfully logged in ${token} </h1>`);
    (app as any).server.close();
  });
  app.listen(54321, (err: Error) => {
    if (err) {
      vscode.window.showErrorMessage(err.message);
    } else {
      vscode.commands.executeCommand(
        "vscode.open",
        vscode.Uri.parse(`${BASEURL}auth/github`)
      );
    }
  });
  console.log("Authenticated");
};
