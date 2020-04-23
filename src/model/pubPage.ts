import { PubPackage } from "./pubPackage";

export class PubPage {
  constructor(nextUrl: string, packages: PubPackage[], json?: any) {
    this.nextUrl = nextUrl;
    this.packages = packages;
    this.json = json;
  }

  public readonly nextUrl: string;
  public readonly packages: PubPackage[];
  public readonly json: any;

  public static fromJSON(json: any): PubPage {
    return new PubPage(
      json["next_url"],
      (json["packages"] as Map<string, any>[]).map((element) =>
        PubPackage.fromJSON(element)
      ),
      json
    );
  }
}
