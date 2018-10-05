"use strict";

import * as vscode from "vscode";
import { openNewGitIssueUrl } from "./web";

enum ErrorOptionType {
  report = "Report issue",
  ignore = "Ignore"
}

let errorOptions = [
  { title: ErrorOptionType.report },
  { title: ErrorOptionType.ignore }
];

export function showInfo(message: string): Thenable<string | undefined> {
  return vscode.window.showInformationMessage(`Pubspec Assist: ${message}`);
}

export function showError(error: Error, isCritical: boolean = false): void {
  let message: string = "Pubspec Assist: ";
  if (!isCritical) {
    message += error.message;
    vscode.window.showErrorMessage(message);
    return;
  }
  message += `
      Error occurred.\n
      Type: "${error.name}"
      Message: "${error.message}"
      `;

  vscode.window
    .showErrorMessage(message, {}, ...errorOptions)
    .then((option?: vscode.MessageItem) => {
      if (option) {
        handleErrorOptionResponse(option.title, error);
      }
    });
}

function handleErrorOptionResponse(option: string, error: Error) {
  switch (option) {
    case ErrorOptionType.report:
      openNewGitIssueUrl(error);
      break;
    default:
      break;
  }
}

export function showCriticalError(error: Error): void {
  showError(error, true);
}
