"use strict";

import * as fs from "fs";
import * as vscode from "vscode";

import { showError, showCriticalError, showInfo } from "../helper/messaging";
import { PubAPI, PubResponse } from "../model/pubApi";
import { PubError } from "../model/pubError";
import { PubPackage } from "../model/pubPackage";
import { safeLoad, safeDump } from "js-yaml";
import { deprecate } from "util";
import { getValue } from "../helper/getValue";
import { PubPackageSearch } from "../model/pubPackageSearch";
import { DependencyType } from "../model/dependencyType";
import { PubspecContext } from "../model/pubspecContext";
import { LabelIcon } from "../helper/labelIcon";

export enum InsertionMethod {
  ADD = "Added",
  REPLACE = "Replaced",
}

export async function addDependency(dependencyType: DependencyType) {
  const api: PubAPI = new PubAPI();

  const context: PubspecContext = {
    ...getFileContext(),
    dependencyType: dependencyType,
  };

  if (!context.openInEditor && !fs.existsSync(context.path)) {
    showError(
      new PubError(
        "Pubspec file not found in workspace root. " +
          "Open the pubspec file you would like to edit and try again."
      )
    );
    return;
  }

  const query = await askPackageName(context);
  if (!query) {
    return;
  }

  const searchingMessage = setMessage({
    message: `Looking for package '${query}'...`,
  });
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

  const gettingPackageMessage = setMessage({
    message: `Getting info for package '${chosenPackageString}'...`,
  });

  let chosenPackageResponse:
    | PubResponse<PubPackage>
    | undefined = await getValue(() => api.getPackage(chosenPackageString));

  if (!chosenPackageResponse) {
    return;
  }

  gettingPackageMessage.dispose();

  const chosenPackage = chosenPackageResponse.result;

  try {
    const preserveNewline = checkNewlineAtEndOfFile(context);
    formatIfOpened(context);
    const pubspecString = getPubspecText(context);
    const modifiedPubspec = addDependencyByText({
      context,
      pubspecString,
      newPackage: chosenPackage,
    });
    const newPubspecString = modifiedPubspec.result.concat(
      preserveNewline ? "\n" : ""
    );

    if (context.openInEditor) {
      const originalLines = pubspecString.split("\n");
      vscode.window.activeTextEditor!.edit((editBuilder) => {
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
    } else {
      fs.writeFileSync(context.path, newPubspecString, "utf-8");
    }

    formatIfOpened(context);

    showInfo(
      `${modifiedPubspec.insertionMethod.toString()} '${
        chosenPackage.name
      }' (version ${chosenPackage.latestVersion}).`
    );
  } catch (error) {
    showCriticalError(error);
  }
}

function getFileContext() {
  const pubspecIsOpen = pubspecFileIsOpen();
  const pubspecPath = pubspecIsOpen
    ? vscode.window.activeTextEditor!.document.uri.fsPath
    : `${vscode.workspace.rootPath}/pubspec.yaml`;

  return {
    openInEditor: pubspecIsOpen,
    path: pubspecPath,
  };
}

function getPubspecText(context: PubspecContext): string {
  return context.openInEditor
    ? vscode.window.activeTextEditor!.document.getText()
    : fs.readFileSync(context.path, "utf8");
}

function checkNewlineAtEndOfFile(context: PubspecContext): boolean {
  return getPubspecText(context).substr(-1) === "\n";
}

function pubspecFileIsOpen() {
  return (
    (vscode.window.activeTextEditor &&
      (vscode.window.activeTextEditor.document.fileName.endsWith(
        "pubspec.yaml"
      ) ||
        vscode.window.activeTextEditor.document.fileName.endsWith(
          "pubspec.yml"
        ))) ||
    false
  );
}

export function addDependencyByText({
  context,
  pubspecString,
  newPackage,
}: {
  context: PubspecContext;
  pubspecString: string;
  newPackage: PubPackage;
}): { insertionMethod: InsertionMethod; result: string } {
  let insertionMethod = InsertionMethod.ADD;

  let lines = pubspecString.split("\n");

  let dependencyTypeQuery = `${context.dependencyType}:`;

  let dependencyLineIndex = lines.findIndex(
    (line) => line.trim() === dependencyTypeQuery
  );

  if (dependencyLineIndex === -1) {
    lines.push(dependencyTypeQuery);
    dependencyLineIndex = lines.length - 1;
  }

  if (dependencyLineIndex === lines.length - 1) {
    lines.push("");
  }

  const existingPackageLineIndex = lines.findIndex((line) => {
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
  "Currently using `addDependencyByText` instead."
);
function addDependencyByObject(
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

function askPackageName(context: PubspecContext): Thenable<string | undefined> {
  return vscode.window.showInputBox({
    prompt: "Enter the package name.",
    placeHolder:
      context.dependencyType === "dependencies"
        ? "Package name (cloud_firestore, get_it, ...)"
        : "Package name (build_runner, freezed, ...)",
  });
}

function setMessage({
  message,
  labelIcon = "sync~spin",
}: {
  message: string;
  labelIcon?: LabelIcon;
}): vscode.Disposable {
  return vscode.window.setStatusBarMessage(`$(${labelIcon}) ${message}`);
}

function selectFrom(options: string[]): Thenable<string | undefined> {
  return vscode.window.showQuickPick(options, {
    canPickMany: false,
    matchOnDescription: true,
  });
}

export function formatIfOpened(context: PubspecContext) {
  if (context.openInEditor) {
    vscode.commands.executeCommand("editor.action.formatDocument");
  }
}

export default addDependency;
