"use strict";

import * as vscode from "vscode";
import * as functions from "./functions";

export function activate(context: vscode.ExtensionContext) {
  let openInputCommand = vscode.commands.registerCommand(
    "pubspec-assist.openInput",
    functions.openInput
  );

  context.subscriptions.push(openInputCommand);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  console.debug("Pubspec Assist: Deactivated.");
}
