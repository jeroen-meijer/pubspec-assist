import * as vscode from "vscode";
import * as functions from "./functions";

export function activate(context: vscode.ExtensionContext) {
  const commands = {
    addDependencyCommand: vscode.commands.registerCommand(
      "pubspec-assist.addDependency",
      () => functions.addDependency("dependencies")
    ),
    addDevDependencyCommand: vscode.commands.registerCommand(
      "pubspec-assist.addDevDependency",
      () => functions.addDependency("dev_dependencies")
    ),
    sortAllDependenciesCommand: vscode.commands.registerCommand(
      "pubspec-assist.sortAllDependencies",
      () => functions.sortAllDependencies()
    ),
  } as const;

  Object.values(commands).forEach((command) =>
    context.subscriptions.push(command)
  );
}

export function deactivate(): void {}
