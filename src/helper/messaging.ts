"use strict";

import * as vscode from "vscode";
import { openNewGitIssueUrl } from "./web";

enum ErrorOptionType {
  report = "Report issue",
  ignore = "Ignore",
  tryAgain = "Try Again",
  close = "Close"
}

let criticalErrorOptions: vscode.MessageItem[] = [
  { title: ErrorOptionType.report },
  { title: ErrorOptionType.ignore }
];

let retryableErrorOptions: vscode.MessageItem[] = [
  { title: ErrorOptionType.tryAgain },
  { title: ErrorOptionType.close }
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
  message += `A critical error has occurred.\n
    If this happens again, please report it.\n\n
    
    Error message: ${error.message}`;

  vscode.window
    .showErrorMessage(message, {}, ...criticalErrorOptions)
    .then((option?: vscode.MessageItem) => {
      if (option) {
        handleErrorOptionResponse(option.title, error);
      }
    });
}

export async function showRetryableError(error: Error): Promise<boolean> {
  let message: string = "Pubspec Assist: ";
  message += `An error has occurred:\n${error.message}`;

  const response:
    | vscode.MessageItem
    | undefined = await vscode.window.showWarningMessage(
    message,
    {},
    ...retryableErrorOptions
  );

  return !!response && response.title === ErrorOptionType.tryAgain;
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
