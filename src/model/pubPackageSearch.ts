export class PubPackageSearch {
  constructor(packages: string[], next?: string, json?: any) {
    this.packages = packages;
    this.next = next;
    this.json = json;
  }

  public readonly next: string | undefined;
  public readonly packages: string[];
  public readonly json: any;

  public static fromJSON(json: any): PubPackageSearch {
    return new PubPackageSearch(
      (json["packages"] as any[]).map((element) => element.package),
      json["next"],
      json
    );
  }
}
