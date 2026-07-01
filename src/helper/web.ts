import * as vscode from "vscode";

import {
  generateNewGitIssueContent,
  generateNewGitIssueUrl,
} from "./gitIssue";

export type { GitIssueContent } from "./gitIssue";
export { generateNewGitIssueContent, generateNewGitIssueUrl } from "./gitIssue";

export async function openNewGitIssueUrl(error: Error) {
  const url = vscode.Uri.parse(
    generateNewGitIssueUrl(generateNewGitIssueContent(error))
  );
  await vscode.env.openExternal(url);
}
