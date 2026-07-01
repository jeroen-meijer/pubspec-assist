import { PubPackage } from "../model/pubPackage";
import { PubspecContext } from "../model/pubspecContext";
import { parseDocument, YAMLMap } from "yaml";

export type PubspecParserResult =
  | { success: true; result: string }
  | { success: false; error: string };

export function addDependenciesToYamlString({
  context,
  pubspecString,
  newPackages,
}: {
  context: PubspecContext;
  pubspecString: string;
  newPackages: PubPackage[];
}): PubspecParserResult {
  const pubspecDoc = parseDocument(pubspecString, { schema: "core" });

  for (const newPackage of newPackages) {
    const versionString = `${context.settings.useCaretSyntax ? "^" : ""}${
      newPackage.latestVersion
    }`;

    const dependencyPath = pubspecDoc.get(context.dependencyType, true);
    const dependencyPathIsEmpty =
      dependencyPath === null || dependencyPath === undefined;
    const dependencyPathIsYAMLMap = dependencyPath instanceof YAMLMap;

    if (
      (dependencyPathIsEmpty || !dependencyPathIsYAMLMap) &&
      !pubspecDoc.contents
    ) {
      pubspecDoc.contents = new YAMLMap() as unknown as NonNullable<
        typeof pubspecDoc.contents
      >;
    }

    const existingDependencies = dependencyPathIsEmpty
      ? {}
      : dependencyPathIsYAMLMap
        ? dependencyPath.toJSON()
        : dependencyPath;

    pubspecDoc.set(context.dependencyType, {
      ...existingDependencies,
      [newPackage.name]: versionString,
    });
  }

  const result = pubspecDoc.toString();

  return { success: true, result };
}
