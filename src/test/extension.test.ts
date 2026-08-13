import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { parseDocument } from "yaml";

import { addDependenciesToYamlString } from "../helper/yamlDependencies";
import { pubspecMockData } from "./pubspecMockData";
import { PubspecMockTestCase } from "./pubspecMockTestCase";
import {
  PubError,
  PubApiSearchError,
  OtherSearchInfo,
} from "../model/pubError";
import {
  generateNewGitIssueUrl,
  generateNewGitIssueContent,
} from "../helper/gitIssue";

const resultsDir = path.join(__dirname, "results");

suite("Extension: Dependency Adding Tests", function () {
  const testCases: PubspecMockTestCase[] = pubspecMockData.map((json: unknown) =>
    PubspecMockTestCase.fromJSON(json)
  );

  cleanLogFiles();

  for (const testCase of testCases) {
    for (const pubspecMock of testCase.mocks) {
      test(`'${testCase.pubPackage.name}' (${testCase.pubPackage.latestVersion}) -> '${pubspecMock.name}'`, function () {
        const result = addDependenciesToYamlString({
          context: {
            openInEditor: true,
            dependencyType: "dependencies",
            settings: {
              autoAddPackage: true,
              useCaretSyntax: true,
              sortDependencies: false,
              useLegacySorting: false,
            },
          },
          pubspecString: pubspecMock.source,
          newPackages: [testCase.pubPackage],
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

        if (!result.success) {
          assert.fail(result.error);
        }
        assert.deepStrictEqual(
          parseDocument(result.result).toJSON(),
          parseDocument(pubspecMock.target).toJSON(),
          "Parsing source pubspec did not result in desired target value."
        );
      });
    }
  }
});

suite("Git Issue Tests", function () {
  const testError: PubError = new PubApiSearchError(
    OtherSearchInfo("Test info.")
  );

  let content: ReturnType<typeof generateNewGitIssueContent>;

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
  if (fs.existsSync(resultsDir)) {
    for (const file of ["targets.yaml", "results.yaml"]) {
      const filePath = path.join(resultsDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } else {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
}

function writeLog(fileName: string, message: string) {
  const filePath = path.join(resultsDir, fileName);
  let originalText = "";
  if (fs.existsSync(filePath)) {
    originalText = fs.readFileSync(filePath, "utf8");
  }
  fs.writeFileSync(filePath, originalText + "\n" + message, { encoding: "utf8" });
}
