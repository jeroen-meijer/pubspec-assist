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
  | { success: true; result: string }
  | { success: false; error: string };

export enum InsertionMethod {
  ADD = "Added",
  REPLACE = "Replaced",
}

export async function addDependency(dependencyType: DependencyType) {
  const api = new PubAPI();

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

  const packageQueries = await getPackageNames(context);
  if (packageQueries.length === 0) {
    return;
  }

  const packagesToAdd: PubPackage[] = [];

  for (const query of packageQueries) {
    const searchingMessage = setMessage({
      message: `Looking for package '${query}'...`,
    });

    const res = await getValue(() => api.smartSearchPackage(query));

    if (!res) {
      continue;
    }

    const searchResult = res.result;
    searchingMessage.dispose();

    if (searchResult.packages.length === 0) {
      showInfo(`Package with name '${packageQueries}' not found.`);
      continue;
    }

    const chosenPackageString =
      searchResult.packages.length === 1
        ? searchResult.packages[0]
        : await selectFrom(query, searchResult.packages);

    if (!chosenPackageString) {
      continue;
    }

    if (chosenPackageString.startsWith("dart:")) {
      showInfo(
        'You don\'t need to add a "dart:" package as a dependency; ' +
          "they're preinstalled and can be imported directly."
      );
      continue;
    }

    const gettingPackageMessage = setMessage({
      message: `Getting info for package '${chosenPackageString}'...`,
    });

    const chosenPackageResponse = await getValue(() =>
      api.getPackage(chosenPackageString)
    );

    gettingPackageMessage.dispose();

    if (!chosenPackageResponse) {
      continue;
    }

    packagesToAdd.push(chosenPackageResponse.result);
  }

  if (packagesToAdd.length === 0) {
    return;
  }

  try {
    formatIfOpened(context);

    const pubspecString = getPubspecText(context);

    const pubspecParserResult = addDependenciesToYamlString({
      context,
      pubspecString,
      newPackages: packagesToAdd,
    });

    if (!pubspecParserResult.success) {
      showError(Error(pubspecParserResult.error));
      return;
    }

    let newPubspecString = pubspecParserResult.result;

    if (context.settings.sortDependencies) {
      newPubspecString = sortDependencies({
        pubspecString: newPubspecString,
        useLegacySorting: context.settings.useLegacySorting,
      });
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

    const infoText =
      packagesToAdd.length === 1
        ? `Added/updated '${packagesToAdd[0].name}' (version ${
            packagesToAdd[0].latestVersion
          })${!context.settings.sortDependencies ? "" : " and sorted file"}.`
        : `Added/updated ${packagesToAdd.length} packages and sorted file.`;

    showInfo(infoText);
  } catch (error) {
    showCriticalError(error);
  }
}

export function addDependenciesToYamlString({
  context,
  pubspecString,
  newPackages,
}: {
  context: PubspecContext;
  pubspecString: string;
  newPackages: PubPackage[];
}): PubspecParserResult {
  const options: YAML.Options = {
    schema: "core",
  };
  const pubspecDoc = YAML.parseDocument(pubspecString, options);

  for (const newPackage of newPackages) {
    const versionString = `${context.settings.useCaretSyntax ? "^" : ""}${
      newPackage.latestVersion
    }`;

    const dependencyPath = pubspecDoc.get(context.dependencyType, true);
    const dependencyPathIsEmpty =
      dependencyPath === null || dependencyPath === undefined;
    const dependencyPathIsYAMLMap = dependencyPath instanceof YAMLMap;

    if (
      (dependencyPathIsEmpty || !dependencyPathIsYAMLMap) &&
      !pubspecDoc.contents
    ) {
      pubspecDoc.contents = new YAMLMap();
    }

    const existingDependencies = dependencyPathIsEmpty
      ? {}
      : dependencyPathIsYAMLMap
      ? dependencyPath.toJSON()
      : dependencyPath;

    pubspecDoc.set(context.dependencyType, {
      ...existingDependencies,
      [newPackage.name]: versionString,
    });
  }

  const result = pubspecDoc.toString();

  return { success: true, result };
}

async function getPackageNames(context: PubspecContext): Promise<string[]> {
  const rawResult = await vscode.window.showInputBox({
    prompt: "Enter package names, separated by commas.",
    placeHolder:
      context.dependencyType === "dependencies"
        ? "Package names (cloud_firestore, get_it, ...)"
        : "Package names (build_runner, freezed, ...)",
  });

  if (!rawResult) {
    return [];
  }

  return rawResult
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
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

function selectFrom(
  original: string,
  items: string[]
): Thenable<string | undefined> {
  return vscode.window.showQuickPick(items, {
    canPickMany: false,
    matchOnDescription: true,
    placeHolder: `Search results for "${original}"`,
  });
}
