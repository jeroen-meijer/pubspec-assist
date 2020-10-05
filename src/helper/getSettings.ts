import * as vscode from "vscode";

export type Settings = {
  autoAddPackage: boolean;
  useCaretSyntax: boolean;
  useLegacyParser: boolean;
  sortDependencies: boolean;
};

export const getSettings = () => {
  const getSettingByKey = <T>(keyName: string): T | undefined =>
    vscode.workspace.getConfiguration().get<T>(`pubspec-assist.${keyName}`);

  return <Settings>{
    autoAddPackage: getSettingByKey("autoAddPackage") ?? true,
    useCaretSyntax: getSettingByKey("useCaretSyntax") ?? true,
    sortDependencies: getSettingByKey("sortDependencies") ?? false,
    useLegacyParser: getSettingByKey("useLegacyParser") ?? false,
  };
};
