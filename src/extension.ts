"use strict";

import * as vscode from "vscode";
import { PubAPI } from "./model/pubApi";
import { PubPackage } from "./model/pubPackage";
import { safeLoad, safeDump } from "js-yaml";
import { deprecate } from "util";

export enum InsertionMethod {
  ADD = "Added",
  REPLACE = "Replaced"
}

export function activate(context: vscode.ExtensionContext) {
  const api: PubAPI = new PubAPI();

  let disposable = vscode.commands.registerCommand(
    "pubspec-assist.openInput",
    async () => {
      if (!vscode.window.activeTextEditor || !pubspecFileIsOpen()) {
        showError("Pubspec Assist: pubspec file not opened.");
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

      const gettingPackageMessage = setMessage(
        `Getting info for package '${chosenPackageString}'...`
      );
      const chosenPackageResponse = await api.getPackage(chosenPackageString);
      gettingPackageMessage.dispose();

      if (!chosenPackageResponse.result) {
        showError("An error has occurred when searching Dart pub.");
        return;
      }

      const chosenPackage = chosenPackageResponse.result;

      try {
        formatDocument();
        const pubspecString = vscode.window.activeTextEditor.document.getText();
        const originalLines = pubspecString.split("\n");
        const modifiedPubspec = addDependencyByText(
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
            modifiedPubspec.result
          );
        });

        showInfo(
          `${modifiedPubspec.insertionMethod.toString()} '${chosenPackage.name}' (version ${
            chosenPackage.latestVersion
          }).`
        );
      } catch (error) {
        console.log("Pubspec Assist: encountered error.", error);
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  console.log("Pubspec Assist: Deactivated.");
}

export function pubspecFileIsOpen() {
  return (
    vscode.window.activeTextEditor &&
    (vscode.window.activeTextEditor.document.fileName.endsWith(
      "pubspec.yaml"
    ) ||
      vscode.window.activeTextEditor.document.fileName.endsWith("pubspec.yml"))
  );
}

export function addDependencyByText(
  pubspecString: string,
  newPackage: PubPackage
): {insertionMethod: InsertionMethod, result: string} {
  let insertionMethod = InsertionMethod.ADD;

  let lines = pubspecString.split("\n");

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

  const existingPackageLineIndex = lines.findIndex(line =>
    line.includes(newPackage.name)
  );
  if (existingPackageLineIndex !== -1) {
    const originalLine = lines[existingPackageLineIndex];

    lines[existingPackageLineIndex] =
      "  " + newPackage.generateDependencyString();

    if (originalLine.includes("\r")) {
      lines[existingPackageLineIndex] += "\r";
    }
    if (originalLine.includes("\n")) {
      lines[existingPackageLineIndex] += "\n";
    }

    insertionMethod = InsertionMethod.REPLACE;
  } else {
    for (let i = dependencyLineIndex + 1; i < lines.length; i++) {
      if (!lines[i].startsWith(" ") && !lines[i].trim().startsWith("#")) {
        lines[i] =
          "  " + newPackage.generateDependencyString() + "\r\n" + lines[i];
        break;
      }
      if (i === lines.length - 1) {
        if (!lines[i].includes("\r")) {
          lines[i] = lines[i] + "\r";
        }
        lines.push("  " + newPackage.generateDependencyString());
        break;
      }
    }
  }

  pubspecString = lines
    .join("\n")
    .split("\n")
    // .map((line, index) => (!(line[0] === " ") ? "\n" + line : line))
    .join("\n")
    .trim();

  return {insertionMethod: insertionMethod, result: pubspecString};
}

deprecate(
  addDependencyByObject,
  "Currently using `addDependenctByText` instead."
);
export function addDependencyByObject(
  pubspecString: string,
  newPackage: PubPackage
): string {
  let pubspec = safeLoad(pubspecString);

  if (!pubspec) {
    pubspec = {};
  }

  if (!pubspec.dependencies) {
    pubspec.dependencies = {};
  }

  pubspec.dependencies[newPackage.name] = `^${newPackage.latestVersion}`;

  return safeDump(pubspec);
}

export function askPackageName(): Thenable<string | undefined> {
  return vscode.window.showInputBox({
    prompt: "Enter the package name.",
    placeHolder: `Package name (cloud_firestore, get_it, ...)`
  });
}

export function setMessage(message: string): vscode.Disposable {
  return vscode.window.setStatusBarMessage(
    `$(pencil) Pubspec Assists: ${message}`
  );
}

export function showError(message: string): Thenable<string | undefined> {
  return vscode.window.showErrorMessage(`Pubspec Assist: ${message}`);
}

export function showInfo(message: string): Thenable<string | undefined> {
  return vscode.window.showInformationMessage(`Pubspec Assist: ${message}`);
}

export function selectFrom(options: string[]): Thenable<string | undefined> {
  return vscode.window.showQuickPick(options, {
    canPickMany: false,
    matchOnDescription: true
  });
}

export function formatDocument() {
  vscode.commands.executeCommand("editor.action.formatDocument");
}
