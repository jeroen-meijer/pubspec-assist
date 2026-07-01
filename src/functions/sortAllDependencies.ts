"use strict";

import * as fs from "fs";
import * as vscode from "vscode";

import { formatIfOpened } from "../helper/formatIfOpened";
import { getFileContext } from "../helper/getFileContext";
import { getPubspecText } from "../helper/getPubspecText";
import { getSettings } from "../helper/getSettings";
import { handleCriticalError, showError } from "../helper/messaging";
import { sortDependencies } from "../helper/sortDependencies";
import { PubspecContext } from "../model/pubspecContext";

export async function sortAllDependencies() {
  const context: PubspecContext = {
    ...getFileContext(),
    settings: getSettings(),
  };

  if (!context.openInEditor && !fs.existsSync(context.path)) {
    showError(
      new Error(
        "Pubspec file not found in workspace root. " +
          "Open the pubspec file you would like to sort and try again.",
      ),
    );
    return;
  }

  try {
    const pubspecString = getPubspecText(context);

    const newPubspecString = sortDependencies({
      pubspecString: pubspecString,
      useLegacySorting: context.settings.useLegacySorting,
    });

    if (context.openInEditor) {
      const originalLines = pubspecString.split("\n");
      vscode.window.activeTextEditor!.edit((editBuilder) => {
        editBuilder.replace(
          new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(
              originalLines.length - 1,
              originalLines[originalLines.length - 1].length,
            ),
          ),
          newPubspecString,
        );
      });
    } else {
      fs.writeFileSync(context.path, newPubspecString, "utf-8");
    }

    formatIfOpened(context);
  } catch (error) {
    handleCriticalError(error);
  }
}
