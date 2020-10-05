import * as assert from "assert";
import * as fs from "fs";

import { addDependencyToYamlString } from "../functions/addDependency";
import { pubspecMockData } from "./pubspecMockData";
import { PubspecMockTestCase } from "./pubspecMockTestCase";
import {
  PubError,
  PubApiSearchError,
  OtherSearchInfo,
} from "../model/pubError";
import {
  GitIssueContent,
  generateNewGitIssueUrl,
  generateNewGitIssueContent,
} from "../helper/web";

suite("Extension: Dependency Adding Tests", function () {
  const testCases: PubspecMockTestCase[] = pubspecMockData.map((json: any) =>
    PubspecMockTestCase.fromJSON(json)
  );

  cleanLogFiles();

  for (let testCase of testCases) {
    for (let pubspecMock of testCase.mocks) {
      test(`'${testCase.pubPackage.name}' (${testCase.pubPackage.latestVersion}) -> '${pubspecMock.name}'`, function () {
        const result = addDependencyToYamlString({
          context: {
            openInEditor: true,
            dependencyType: "dependencies",
            settings: {
              autoAddPackage: true,
              useCaretSyntax: true,
              sortDependencies: false,
              useLegacyParser: false,
            },
          },
          pubspecString: pubspecMock.source,
          newPackage: testCase.pubPackage,
        });

        writeLog(
          "targets.yaml",
          `${testCase.pubPackage.name} (${
            testCase.pubPackage.latestVersion
          }) - ${pubspecMock.name}:\t${JSON.stringify(pubspecMock.target)}`
        );
        writeLog(
          "results.yaml",
          `${testCase.pubPackage.name} (${
            testCase.pubPackage.latestVersion
          }) - ${pubspecMock.name}:\t${JSON.stringify(result)}`
        );

        assert(
          JSON.stringify(result) === JSON.stringify(pubspecMock.target),
          "Parsing source pubspec with 'addDependencyByText' method did not result in desired target value."
        );
      });
    }
  }
});

suite("Pub API Tests", function () {});

suite("Git Issue Tests", function () {
  const testError: PubError = new PubApiSearchError(
    OtherSearchInfo("Test info.")
  );

  let content: GitIssueContent;

  test("Generate Git issue content with PubApiSearchError.", function () {
    content = generateNewGitIssueContent(testError);
  });

  test("Generate Git issue url with content generated from PubApiSearchError.", function () {
    if (!content) {
      throw new Error(
        "Content generator is broken, so generating a url is impossible."
      );
    }
    generateNewGitIssueUrl(content);
  });
});

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
