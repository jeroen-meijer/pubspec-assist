import * as vscode from "vscode";

export function getFileContext() {
  const pubspecIsOpen = pubspecFileIsOpen();

  if (pubspecIsOpen) {
    return { openInEditor: true as const };
  }

  const workspacePubspecPath = getWorkspacePubspecPath();
  return {
    openInEditor: false as const,
    path: workspacePubspecPath ?? "",
  };
}

function getWorkspacePubspecPath(): string | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder ? `${folder.uri.fsPath}/pubspec.yaml` : undefined;
}

function pubspecFileIsOpen() {
  return (
    (vscode.window.activeTextEditor &&
      (vscode.window.activeTextEditor.document.fileName.endsWith(
        "pubspec.yaml",
      ) ||
        vscode.window.activeTextEditor.document.fileName.endsWith(
          "pubspec.yml",
        ))) ||
    false
  );
}
