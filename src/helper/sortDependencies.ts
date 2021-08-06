import * as YAML from "yaml";
import { Pair, Scalar, YAMLMap } from "yaml/types";
import { dependencyTypes } from "../model/dependencyType";

export function sortDependencies({
  pubspecString,
  useLegacySorting,
}: {
  pubspecString: string;
  useLegacySorting: boolean;
}) {
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

    const baseSortedItems = (dependencyPath.items as Pair[]).sort(sortByKey);

    let sortedDependencies: Pair[] = baseSortedItems;
    if (useLegacySorting) {
      const sortedItemsByImportType = {
        sdk: baseSortedItems.filter(containsKey("sdk")),
        path: baseSortedItems.filter(containsKey("path")),
        git: baseSortedItems.filter(containsKey("git")),
        hosted: baseSortedItems.filter(containsKey("hosted")),
      };

      sortedDependencies = [
        ...sortedItemsByImportType.sdk,
        ...sortedItemsByImportType.path,
        ...sortedItemsByImportType.git,
        ...sortedItemsByImportType.hosted,
        ...baseSortedItems,
      ];
    }

    const newDependencyMap = new YAMLMap();
    for (const item of sortedDependencies) {
      if (!newDependencyMap.has(item.key)) {
        newDependencyMap.add(item);
      }
    }

    pubspecDoc.set(dependencyType, newDependencyMap);
  }

  return pubspecDoc.toString();
}

export default sortDependencies;
