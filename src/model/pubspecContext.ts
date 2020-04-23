import { DependencyType } from "./dependencyType";

export type PubspecContext =
  | {
      dependencyType: DependencyType;
      openInEditor: true;
    }
  | {
      dependencyType: DependencyType;
      openInEditor: false;
      path: string;
    };
