"use strict";

import * as vscode from "vscode";
import { openNewGitIssueUrl } from "./web";

enum ErrorOptionType {
  report = "Report issue",
  ignore = "Ignore",
  tryAgain = "Try Again",
  close = "Close",
}

let criticalErrorOptions: vscode.MessageItem[] = [
  { title: ErrorOptionType.report },
  { title: ErrorOptionType.ignore },
];

let retryableErrorOptions: vscode.MessageItem[] = [
  { title: ErrorOptionType.tryAgain },
  { title: ErrorOptionType.close },
];

export function showInfo(message: string): Thenable<string | undefined> {
  return vscode.window.showInformationMessage(message);
}

export function showError(error: Error, isCritical: boolean = false): void {
  if (!isCritical) {
    vscode.window.showErrorMessage(error.message);
  } else {
    vscode.window
      .showErrorMessage(
        `A critical error has occurred.\n
      If this happens again, please report it.\n\n

      Error message: ${error.message}`,
        {},
        ...criticalErrorOptions
      )
      .then((option?: vscode.MessageItem) => {
        if (option) {
          handleErrorOptionResponse(option.title, error);
        }
      });
  }
}

export async function showRetryableError(error: Error): Promise<boolean> {
  const response: vscode.MessageItem | undefined =
    await vscode.window.showWarningMessage(
      `An error has occurred:\n${error.message}`,
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

export function handleCriticalError(error: unknown): void {
  if (error instanceof Error) {
    if (error.message.includes("Document with errors cannot be stringified")) {
      showError(
        new Error(
          "Your pubspec YAML file is invalid or contains errors. " +
            "Please fix them and try again."
        )
      );
    } else {
      showError(error, true);
    }
  } else {
    showError(new Error(`Unknown error: ${error}`), true);
  }
}
