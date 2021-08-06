import * as vscode from "vscode";

export type Settings = {
  autoAddPackage: boolean;
  sortDependencies: boolean;
  useLegacySorting: boolean;
  useCaretSyntax: boolean;
  useLegacyParser: boolean;
};

export const getSettings = () => {
  const getSettingByKey = <T>(keyName: string): T | undefined =>
    vscode.workspace.getConfiguration().get<T>(`pubspec-assist.${keyName}`);

  return <Settings>{
    autoAddPackage: getSettingByKey("autoAddPackage") ?? true,
    sortDependencies: getSettingByKey("sortDependencies") ?? false,
    useLegacySorting: getSettingByKey("useLegacySorting") ?? false,
    useCaretSyntax: getSettingByKey("useCaretSyntax") ?? true,
    useLegacyParser: getSettingByKey("useLegacyParser") ?? false,
  };
};
