"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { PubAPI } from "./model/pubApi";
import { PubPackage } from "./model/pubPackage";
import { safeLoad, safeDump } from "js-yaml";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const api: PubAPI = new PubAPI();

  let disposable = vscode.commands.registerCommand(
    "extension.openInput",
    async () => {
      if (!pubspecFileIsOpen()) {
        vscode.window.showErrorMessage(
          "Pubspec Assist: pubspec file not opened."
        );
        return;
      }

      const query = await askPackageName();
      if (!query) {
        return;
      }

      const searchingMessage = setMessage(`Looking for package '${query}'...`);
      let res = await api.smartSearchPackage(query);
      const searchResult = res.result;
      searchingMessage.dispose();

      if (!searchResult) {
        showError("An error has occurred when searching Dart pub.");
        return;
      }

      if (searchResult.packages.length === 0) {
        showError(`Package with name '${query}' not found.`);
        return;
      }

      const chosenPackageString =
        searchResult.packages.length === 1
          ? searchResult.packages[0]
          : await selectFrom(searchResult.packages);

      if (!chosenPackageString) {
        return;
      }

      const gettingPackageMessage = setMessage(`Getting info for package '${chosenPackageString}'...`);
      const chosenPackageResponse = await api.getPackage(chosenPackageString);
      gettingPackageMessage.dispose();

      if (!chosenPackageResponse.result) {
        showError("An error has occurred when searching Dart pub.");
        return;
      }

      const chosenPackage = chosenPackageResponse.result;

      try {
        const pubspecString = vscode.window.activeTextEditor.document.getText();
        const originalLines = pubspecString.split("\n");
        const newPubspecString = addDependencyByText(
          pubspecString,
          chosenPackage
        );

        vscode.window.activeTextEditor.edit(editBuilder => {
          editBuilder.replace(
            new vscode.Range(
              new vscode.Position(0, 0),
              new vscode.Position(
                originalLines.length - 1,
                originalLines[originalLines.length - 1].length
              )
            ),
            newPubspecString
          );
        });

        showInfo(
          `Added '${chosenPackage.name}' (version ${
            chosenPackage.latestVersion
          }).`
        );
      } catch (error) {
        console.log("error ", error);
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  console.log("Deactivate!!!");
}

function pubspecFileIsOpen() {
  return (
    vscode.window.activeTextEditor &&
    (vscode.window.activeTextEditor.document.fileName.endsWith(
      "pubspec.yaml"
    ) ||
      vscode.window.activeTextEditor.document.fileName.endsWith("pubspec.yml"))
  );
}

function addDependencyByText(
  pubspecString: string,
  newPackage: PubPackage
): string {
  console.log("addDependencyByText");

  let lines = pubspecString
    .split("\n");

  let dependencyLineIndex = lines.findIndex(
    line => line.trim() === "dependencies:"
  );

  if (dependencyLineIndex === -1) {
    lines.push("dependencies:");
    dependencyLineIndex = lines.length - 1;
  }

  if (dependencyLineIndex === lines.length - 1) {
    lines.push("");
  }

  for (let i = dependencyLineIndex + 1; i < lines.length; i++) {
    if (!lines[i].startsWith(" ") && !lines[i].trim().startsWith("#")) {
      lines[i] = "  " + newPackage.generateDependencyString() + "\n" + lines[i];
      break;
    }
  }

  pubspecString = lines
    .join("\n")
    .split("\n")
    // .map((line, index) => (!(line[0] === " ") ? "\n" + line : line))
    .join("\n")
    .trim();

  console.log(pubspecString);

  return pubspecString;
}

function addDependencyByObject(
  pubspecString: string,
  newPackage: PubPackage
): string {
  console.log("addDependencyByObject");

  let pubspec = safeLoad(pubspecString);

  if (!pubspec) {
    pubspec = {};
  }

  if (!pubspec.dependencies) {
    pubspec.dependencies = {};
  }

  pubspec.dependencies[newPackage.name] = `^${newPackage.latestVersion}`;

  console.log(pubspec);

  return safeDump(pubspec);
}

function askPackageName(): Thenable<string | undefined> {
  return vscode.window.showInputBox({
    prompt: "Enter the package name.",
    placeHolder: `Package name (cloud_firestore, get_it, ...)`
  });
}

function setMessage(message: string): vscode.Disposable {
  return vscode.window.setStatusBarMessage(`$(pencil) Pubspec Assists: ${message}`);
}

function showError(message: string): Thenable<string | undefined> {
  return vscode.window.showErrorMessage(`Pubspec Assist: ${message}`);
}

function showInfo(message: string): Thenable<string | undefined> {
  return vscode.window.showInformationMessage(`Pubspec Assist: ${message}`);
}

function selectFrom(options: string[]): Thenable<string | undefined> {
  return vscode.window.showQuickPick(options, {
    canPickMany: false,
    matchOnDescription: true
  });
}
