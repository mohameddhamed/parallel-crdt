// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HelloWorldPanel } from './HelloWorldPanel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "parallel-code" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('parallel-code.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello Modified from parallel-code!');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('parallel-code.showWebView', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		HelloWorldPanel.createOrShow(context.extensionUri);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('parallel-code.AskQuestion', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const answer = await vscode.window.showInformationMessage('How was your day?', "Good", "Gooder");

		if (answer == "Good") {
			vscode.window.showInformationMessage('Great');
		} else {
			vscode.window.showInformationMessage('Greater');
		}
	}));

	
}

// This method is called when your extension is deactivated
export function deactivate() {}
