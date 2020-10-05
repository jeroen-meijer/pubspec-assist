"use strict";

import * as vscode from "vscode";

export function getFileContext() {
  const pubspecIsOpen = pubspecFileIsOpen();
  const pubspecPath = pubspecIsOpen
    ? vscode.window.activeTextEditor!.document.uri.fsPath
    : `${vscode.workspace.rootPath}/pubspec.yaml`;

  return {
    openInEditor: pubspecIsOpen,
    path: pubspecPath,
  };
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
