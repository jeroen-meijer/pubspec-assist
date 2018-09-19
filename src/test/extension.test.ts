import * as assert from "assert";
import { PubPackage } from "../model/pubPackage";
import { PubspecMock } from "./pubspecMock";
import { pubspecMockData } from "./pubspecMockData";
import { addDependencyByText } from "../extension";
import * as fs from "fs";

suite("Extension: Dependency Adding Tests", function() {
  const packageMock: PubPackage = new PubPackage("testpackage", "1.1.1", true);
  const pubspecMocks: PubspecMock[] = pubspecMockData["mocks"].map(
    (item: any) => PubspecMock.fromJSON(item)
  );

  cleanLogFiles();

  for (let i = 0; i < pubspecMocks.length; i++) {
    const pubspecMock = pubspecMocks[i];

    test(`'${packageMock.name}' (${packageMock.latestVersion}) -> '${
      pubspecMock.name
    }'`, function() {
      const result: string = addDependencyByText(
        pubspecMock.source,
        packageMock
      ).result;

      writeLog(
        "targets.yaml",
        `${pubspecMock.name}:\t${JSON.stringify(pubspecMock.target)}`
      );
      writeLog(
        "results.yaml",
        `${pubspecMock.name}:\t${JSON.stringify(result)}`
      );

      assert(
        JSON.stringify(result) === JSON.stringify(pubspecMock.target),
        "Parsing source pubspec with 'addDependencyByText' method did not result in desired target value."
      );
    });
  }
});

suite("Pub API Tests", function() {});

function cleanLogFiles(): void {
  if (
    fs.existsSync(
      "/Users/jeroen/Projects/_extensions/pubspec-assist/src/test/results/"
    )
  ) {
    fs.unlinkSync(
      "/Users/jeroen/Projects/_extensions/pubspec-assist/src/test/results/targets.yaml"
    );
    fs.unlinkSync(
      "/Users/jeroen/Projects/_extensions/pubspec-assist/src/test/results/results.yaml"
    );
  } else {
    fs.mkdirSync(
      "/Users/jeroen/Projects/_extensions/pubspec-assist/src/test/results/"
    );
  }
}

function writeLog(fileName: string, message: string) {
  let originalText = "";
  if (
    fs.existsSync(
      `/Users/jeroen/Projects/_extensions/pubspec-assist/src/test/results/${fileName}`
    )
  ) {
    originalText = fs.readFileSync(
      `/Users/jeroen/Projects/_extensions/pubspec-assist/src/test/results/${fileName}`,
      "utf8"
    );
  }
  fs.writeFileSync(
    `/Users/jeroen/Projects/_extensions/pubspec-assist/src/test/results/${fileName}`,
    originalText + "\n" + message,
    { encoding: "utf8" }
  );
}
