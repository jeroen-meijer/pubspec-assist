import * as vscode from "vscode";
import { PubspecContext } from "../model/pubspecContext";

export function formatIfOpened(context: PubspecContext) {
  if (context.openInEditor) {
    vscode.commands.executeCommand("editor.action.formatDocument");
  }
}
