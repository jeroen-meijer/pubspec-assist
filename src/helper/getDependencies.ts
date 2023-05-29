import * as YAML from "yaml";
import { Pair, YAMLMap } from "yaml/types";
import { PubspecContext } from "../model/pubspecContext";
import { getPubspecText } from "./getPubspecText";

export async function getAllPackageNames(context: PubspecContext): Promise<string[]> {
  const pubspecString = getPubspecText(context);
  const options: YAML.Options = {
    schema: "core",
  };
  const pubspecDoc = YAML.parseDocument(pubspecString, options);
  const dependencyPath = pubspecDoc.get(context.dependencyType) as YAMLMap;
  const dependencies = (dependencyPath.items as Pair[]);
  const packageNames = dependencies.map((pair) => pair.key.value.toString().trim().toLowerCase());

  return packageNames;
}