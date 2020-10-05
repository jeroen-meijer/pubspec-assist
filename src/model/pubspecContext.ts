import { DependencyType } from "./dependencyType";
import { Settings } from "../helper/getSettings";

export type PubspecContext =
  | {
      settings: Settings;
      dependencyType?: DependencyType;
      openInEditor: true;
    }
  | {
      settings: Settings;
      dependencyType?: DependencyType;
      openInEditor: false;
      path: string;
    };
