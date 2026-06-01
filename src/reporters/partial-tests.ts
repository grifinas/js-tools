import * as path from "path";

interface TestResult {
  testFilePath: string;
  numFailingTests: number;
}

class PartialTestsReporter {
  onTestResult(_test: unknown, testResult: TestResult): void {
    const status = testResult.numFailingTests > 0 ? "FAIL" : "PASS";

    console.log(`${status} ${path.relative(process.cwd(), testResult.testFilePath)}`);
  }
}

export = PartialTestsReporter;
