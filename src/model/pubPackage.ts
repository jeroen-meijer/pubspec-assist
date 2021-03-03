import * as vscode from "vscode";
import { readFileSync } from "fs";
import * as semver from "semver";

export class PubPackage {
  constructor(
    name: string,
    latestVersion: string,
    flutterCompatible: boolean = false
  ) {
    this.name = name;
    this.latestVersion = latestVersion;
    this.flutterCompatible = flutterCompatible;
  }

  public readonly name: string;
  public readonly latestVersion: string;
  public readonly flutterCompatible: boolean;

  public static fromJSON(json: any): PubPackage {
    return new PubPackage(
      json["name"],
      this.getLatestCompatibleVersion(json),
      this.checkFlutterCompatibility(json)
    );
  }

  private static getLatestCompatibleVersion(json: any) : string {
    // We get the current flutter sdk path from the vs configuration
    let dartPath = vscode.workspace.getConfiguration('dart').get('sdkPath')
    let flutterPath =  vscode.workspace.getConfiguration('dart').get('flutterSdkPath');
    let sdkPath;
    if (dartPath) {
      sdkPath = String(dartPath) + '/version'
    } else {
      sdkPath = String(flutterPath) + '/bin/cache/dart-sdk/version'
    }
    if (!sdkPath) return json['version']
    let buffer = readFileSync(sdkPath)
    let dartVer = buffer.toString()

    // We do a regex search just to be sure we are getting a valid semver string
    let regex = RegExp(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/);
    let matches = regex.exec(dartVer);
    let sdkVer = matches ? matches[0] : '';

    // We filter out the versions that are not compatible with our SDK version
    let filteredItems = json['versions'].filter((item: any, index: number, array: any) => {
      let env = item['pubspec']['environment']['sdk'];
      return semver.satisfies(sdkVer, env)
    });

    return filteredItems.pop()['version'] ?? json['version']
  }

  private static checkFlutterCompatibility(json: any): boolean {
    const dependencies = json["latest"]["pubspec"]["dependencies"];
    if (dependencies && dependencies["flutter"]) {
      return true;
    }

    return false;
  }
}
