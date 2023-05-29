"use strict";

import * as vscode from "vscode";
import * as functions from "./functions";

export function activate(context: vscode.ExtensionContext) {
  const commands = {
    addDependencyCommand: vscode.commands.registerCommand(
      "pubspec-assist.addDependency",
      (_: vscode.ExtensionContext) => functions.addDependency("dependencies")
    ),
    addDevDependencyCommand: vscode.commands.registerCommand(
      "pubspec-assist.addDevDependency",
      (_: vscode.ExtensionContext) => functions.addDependency("dev_dependencies")
    ),
    sortAllDependenciesCommand: vscode.commands.registerCommand(
      "pubspec-assist.sortAllDependencies",
      (_: vscode.ExtensionContext) => functions.sortAllDependencies()
    ),
    updateAllDependenciesCommand: vscode.commands.registerCommand(
      "pubspec-assist.updateAllDependencies",
      (_: vscode.ExtensionContext) => functions.updateAllDependencies("dependencies")
    ),
    updateAllDevDependenciesCommand: vscode.commands.registerCommand(
      "pubspec-assist.updateAllDevDependencies",
      (_: vscode.ExtensionContext) => functions.updateAllDependencies("dev_dependencies")
    ),
  } as const;

  Object.values(commands).forEach((command) =>
    context.subscriptions.push(command)
  );
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
