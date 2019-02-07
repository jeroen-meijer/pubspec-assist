"use strict";

import * as vscode from "vscode";

import { showError, showCriticalError, showInfo } from "../helper/messaging";
import { PubAPI, PubResponse } from "../model/pubApi";
import { PubError } from "../model/pubError";
import { PubPackage } from "../model/pubPackage";
import { safeLoad, safeDump } from "js-yaml";
import { deprecate } from "util";
import { getValue } from "../helper/getValue";
import { PubPackageSearch } from "../model/pubPackageSearch";

export enum InsertionMethod {
  ADD = "Added",
  REPLACE = "Replaced"
}

export async function openInput(context: vscode.ExtensionContext) {
  const api: PubAPI = new PubAPI();
  if (!vscode.window.activeTextEditor || !pubspecFileIsOpen()) {
    showError(new PubError("Pubspec file not opened."));
    return;
  }

  const query = await askPackageName();
  if (!query) {
    return;
  }

  const searchingMessage = setMessage(`Looking for package '${query}'...`);
  let res: PubResponse<PubPackageSearch> | undefined = await getValue(() =>
    api.smartSearchPackage(query)
  );

  if (!res) {
    return;
  }

  const searchResult = res.result;
  searchingMessage.dispose();

  if (searchResult.packages.length === 0) {
    showInfo(`Package with name '${query}' not found.`);
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

  let chosenPackageResponse:
    | PubResponse<PubPackage>
    | undefined = await getValue(() => api.getPackage(chosenPackageString));

  if (!chosenPackageResponse) {
    return;
  }

  gettingPackageMessage.dispose();

  const chosenPackage = chosenPackageResponse.result;

  try {
    formatDocument();
    const pubspecString = vscode.window.activeTextEditor.document.getText();
    const originalLines = pubspecString.split("\n");
    const modifiedPubspec = addDependencyByText(pubspecString, chosenPackage);

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
      `${modifiedPubspec.insertionMethod.toString()} '${
        chosenPackage.name
      }' (version ${chosenPackage.latestVersion}).`
    );
  } catch (error) {
    showCriticalError(error);
  }
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
): { insertionMethod: InsertionMethod; result: string } {
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

  const existingPackageLineIndex = lines.findIndex(line => {
    if (!line.includes(":")) {
      return false;
    }

    const sanitizedLine: string = line.trim();
    const colonIndex: number = sanitizedLine.indexOf(":");
    const potentialMatch = sanitizedLine.substring(0, colonIndex);

    return potentialMatch.trim() === newPackage.name;
  });
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

  return { insertionMethod: insertionMethod, result: pubspecString };
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

export function selectFrom(options: string[]): Thenable<string | undefined> {
  return vscode.window.showQuickPick(options, {
    canPickMany: false,
    matchOnDescription: true
  });
}

export function formatDocument() {
  vscode.commands.executeCommand("editor.action.formatDocument");
}

export default openInput;
