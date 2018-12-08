import { PubspecMock } from "./pubspecMock";
import { PubPackage } from "../model/pubPackage";

export class PubspecMockTestCase {
  constructor(pubPackage: PubPackage, mocks: PubspecMock[]) {
    this.pubPackage = pubPackage;
    this.mocks = mocks;
  }

  public readonly pubPackage: PubPackage;
  public readonly mocks: PubspecMock[];

  public static fromJSON(json: any): PubspecMockTestCase {
    const packageJson: any = json["package"];
    const pubPackage: PubPackage = new PubPackage(
      packageJson["name"],
      packageJson["latest_version"],
      packageJson["flutter_compatible"]
    );
    const mocks: PubspecMock[] = json["mocks"].map((item: any) =>
      PubspecMock.fromJSON(item)
    );
    return new PubspecMockTestCase(pubPackage, mocks);
  }
}
