export class PubspecMock {
  constructor(name: string, source: string, target: string) {
    this.name = name;
    this.source = source;
    this.target = target;
  }

  public readonly name: string;
  public readonly source: string;
  public readonly target: string;

  public static fromJSON(json: any): PubspecMock {
    return new PubspecMock(json["name"], json["source"], json["target"]);
  }
}
