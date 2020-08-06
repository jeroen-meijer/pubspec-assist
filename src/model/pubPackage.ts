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
      json["latest"]["version"],
      this.checkFlutterCompatibility(json)
    );
  }

  private static checkFlutterCompatibility(json: any): boolean {
    const dependencies = json["latest"]["pubspec"]["dependencies"];
    if (dependencies && dependencies["flutter"]) {
      return true;
    }

    return false;
  }
}
