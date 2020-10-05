import * as fs from "fs";
import * as vscode from "vscode";
import { PubspecContext } from "../model/pubspecContext";

export function getPubspecText(context: PubspecContext): string {
  return context.openInEditor
    ? vscode.window.activeTextEditor!.document.getText()
    : fs.readFileSync(context.path, "utf8");
}
