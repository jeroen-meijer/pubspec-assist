import { parseDocument, YAMLMap, Pair, Scalar } from "yaml";
import { dependencyTypes } from "../model/dependencyType";

export function sortDependencies({
  pubspecString,
  useLegacySorting,
}: {
  pubspecString: string;
  useLegacySorting: boolean;
}) {
  const pubspecDoc = parseDocument(pubspecString, { schema: "core" });

  const unboundedReplacementToken = "__UNBOUNDED_DEPENDENCY__";

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
      String((a.key as Scalar).value) < String((b.key as Scalar).value)
        ? -1
        : 1;
    const containsKey = (key: string) => (item: Pair) =>
      !!item.value &&
      item.value instanceof YAMLMap &&
      item.value.items.some(
        (entry) => String((entry.key as Scalar).value) === key
      );

    const setNullValuePairsToUnbounded = (item: Pair) =>
      item.value
        ? item
        : new Pair(item.key, new Scalar(unboundedReplacementToken));

    const baseSortedItems = (dependencyPath.items as Pair[])
      .sort(sortByKey)
      .map(setNullValuePairsToUnbounded);

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

  const dirtyPubspecString = pubspecDoc.toString();

  return dirtyPubspecString
    .replace(new RegExp(unboundedReplacementToken, "g"), "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

export default sortDependencies;
