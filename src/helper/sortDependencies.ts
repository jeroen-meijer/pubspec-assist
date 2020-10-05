import * as YAML from "yaml";
import { Pair, Scalar, YAMLMap } from "yaml/types";
import { dependencyTypes } from "../model/dependencyType";

export function sortDependencies(pubspecString: string) {
  const options: YAML.Options = {
    schema: "core",
  };
  const pubspecDoc = YAML.parseDocument(pubspecString, options);

  for (const dependencyType of dependencyTypes) {
    const dependencyPath = pubspecDoc.get(dependencyType) as
      | null
      | undefined
      | YAMLMap;

    const dependencyPathIsMap = dependencyPath instanceof YAMLMap;

    if (
      dependencyPath === null ||
      dependencyPath === undefined ||
      !dependencyPathIsMap
    ) {
      continue;
    }

    const sortByKey = (a: Pair, b: Pair) =>
      (a.key as Scalar).value < (b.key as Scalar).value ? -1 : 1;
    const containsKey = (key: string) => (item: Pair) =>
      item.value.type === "MAP" &&
      item.value.items.some((item: Pair) => item.key.value === key);

    const sortedItems = (dependencyPath.items as Pair[]).sort(sortByKey);

    const sortedItemsByImportType = {
      sdk: sortedItems.filter(containsKey("sdk")),
      path: sortedItems.filter(containsKey("path")),
      git: sortedItems.filter(containsKey("git")),
      hosted: sortedItems.filter(containsKey("hosted")),
    };

    const newDependencyMap = new YAMLMap();
    for (const item of [
      ...sortedItemsByImportType.sdk,
      ...sortedItemsByImportType.path,
      ...sortedItemsByImportType.git,
      ...sortedItemsByImportType.hosted,
      ...sortedItems,
    ]) {
      if (!newDependencyMap.has(item.key)) {
        newDependencyMap.add(item);
      }
    }

    pubspecDoc.set(dependencyType, newDependencyMap);
  }

  return pubspecDoc.toString();
}

export default sortDependencies;
