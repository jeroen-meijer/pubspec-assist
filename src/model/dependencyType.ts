export type DependencyType = "dependencies" | "dev_dependencies";
export const dependencyTypes: readonly DependencyType[] = [
  "dependencies",
  "dev_dependencies",
] as const;
