import * as vscode from "vscode"
import { BASEURL } from "./constants";
import * as polka from 'polka'
import { TokenManager } from "./TokenManager";
import * as jwt  from "jsonwebtoken";

export const authenticate = (fn : () => void) => {
    const app = polka()

    app.get('auth/:token', async (req, res) => {
        const {token} = req.params;
        if (token) {
            await TokenManager.setToken(token);
            res.end(`<h1> You have successfully logged in ${token} </h1>`);
            fn();
            (app as any).server.close();
        } else {
            res.end('Error occurred during auth');
        }

    })
    app.listen(54321, (err : Error) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
        } else {
            vscode.commands.executeCommand(
                "vscode.open",
                vscode.Uri.parse(`${BASEURL}auth/github`)
            );
        }
    });
    console.log('Authenticated');

    
}