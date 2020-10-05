"use strict";

import * as fs from "fs";
import * as vscode from "vscode";

import { showError, showCriticalError, showInfo } from "../helper/messaging";
import { PubAPI } from "../model/pubApi";
import { PubPackage } from "../model/pubPackage";
import { getValue } from "../helper/getValue";
import { DependencyType } from "../model/dependencyType";
import { PubspecContext } from "../model/pubspecContext";
import { LabelIcon } from "../helper/labelIcon";
import { getSettings } from "../helper/getSettings";
import * as YAML from "yaml";
import { YAMLMap } from "yaml/types";
import { sortDependencies } from "../helper/sortDependencies";
import { getFileContext } from "../helper/getFileContext";
import { getPubspecText } from "../helper/getPubspecText";
import { formatIfOpened } from "../helper/formatIfOpened";

export type PubspecParserResult =
  | { success: true; insertionMethod: InsertionMethod; result: string }
  | { success: false; error: string };

export enum InsertionMethod {
  ADD = "Added",
  REPLACE = "Replaced",
}

export async function addDependency(dependencyType: DependencyType) {
  const api: PubAPI = new PubAPI();

  const context: PubspecContext = {
    ...getFileContext(),
    settings: getSettings(),
    dependencyType: dependencyType,
  };

  if (!context.openInEditor && !fs.existsSync(context.path)) {
    showError(
      new Error(
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

  const res = await getValue(() => api.smartSearchPackage(query));

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

  if (chosenPackageString.startsWith("dart:")) {
    showInfo(
      'You don\'t need to add a "dart:" package as a dependency; ' +
        "they're preinstalled and can be imported directly."
    );
    return;
  }

  const gettingPackageMessage = setMessage({
    message: `Getting info for package '${chosenPackageString}'...`,
  });

  const chosenPackageResponse = await getValue(() =>
    api.getPackage(chosenPackageString)
  );

  gettingPackageMessage.dispose();

  if (!chosenPackageResponse) {
    return;
  }

  const chosenPackage = chosenPackageResponse.result;

  try {
    formatIfOpened(context);
    const pubspecString = getPubspecText(context);

    const pubspecParserResult = addDependencyToYamlString({
      context,
      pubspecString,
      newPackage: chosenPackage,
    });

    if (!pubspecParserResult.success) {
      showError(Error(pubspecParserResult.error));
      return;
    }

    let newPubspecString = pubspecParserResult.result;

    if (context.settings.sortDependencies) {
      newPubspecString = sortDependencies(newPubspecString);
    }

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
      `${pubspecParserResult.insertionMethod.toString()} '${
        chosenPackage.name
      }' (version ${chosenPackage.latestVersion})${
        !context.settings.sortDependencies ? "" : " and sorted file"
      }.`
    );
  } catch (error) {
    showCriticalError(error);
  }
}

export function addDependencyToYamlString({
  context,
  pubspecString,
  newPackage,
}: {
  context: PubspecContext;
  pubspecString: string;
  newPackage: PubPackage;
}): PubspecParserResult {
  const options: YAML.Options = {
    schema: "core",
  };
  const pubspecDoc = YAML.parseDocument(pubspecString, options);

  const entryExists = pubspecDoc.hasIn([
    context.dependencyType,
    newPackage.name,
  ]);

  const insertionMethod = entryExists
    ? InsertionMethod.REPLACE
    : InsertionMethod.ADD;

  const versionString = `${context.settings.useCaretSyntax ? "^" : ""}${
    newPackage.latestVersion
  }`;

  const dependencyPath = pubspecDoc.get(context.dependencyType);
  const dependencyPathIsEmpty =
    dependencyPath === null || dependencyPath === undefined;
  const dependencyPathIsYAMLMap = dependencyPath instanceof YAMLMap;

  if (dependencyPathIsEmpty || !dependencyPathIsYAMLMap) {
    if (!pubspecDoc.contents) {
      pubspecDoc.contents = new YAMLMap();
    }

    pubspecDoc.set(context.dependencyType, {
      [newPackage.name]: versionString,
    });
  } else {
    (dependencyPath as YAMLMap).set(newPackage.name, versionString);
  }

  const result = pubspecDoc.toString();

  return { success: true, insertionMethod, result };
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
