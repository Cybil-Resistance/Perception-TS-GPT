import { assert, expect } from "chai";
import fs from "fs";
import path from "path";
import FileWrite from "@src/operations/file_write";

describe("Operations: Write to file", () => {
	const workingDirectory = path.resolve(process.cwd() + "/tmp/");
	const testFilePath = workingDirectory + "/test-output.txt";
	const badTestFilePath = workingDirectory + "/../test-output.txt";
	const testFileContents = "This is a test file.";

	before(async () => {
		if (!fs.existsSync(workingDirectory)) {
			fs.mkdirSync(workingDirectory);
		}
	});

	afterEach(async () => {
		try {
			fs.unlinkSync(testFilePath);
		} catch (error) {
			if (error.code !== "ENOENT") {
				console.error(`Error deleting test file: ${error.message}`);
			}
		}
	});

	it("should write contents to a file at a given location", async () => {
		FileWrite.setWorkingDirectory(workingDirectory);
		await FileWrite.run(testFilePath, testFileContents);
		const fileContents = fs.readFileSync(testFilePath, { encoding: "utf-8" });

		expect(fileContents).to.equal(testFileContents);
	});

	it("should not allow writing contents to a file outside of the specified directory", async () => {
		try {
			FileWrite.setWorkingDirectory(workingDirectory);
			await FileWrite.run(badTestFilePath, testFileContents);
			assert.fail(
				workingDirectory,
				badTestFilePath,
				"File should not have been allowed to be written outside of the working directory.",
			);
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			expect(e.message).to.equal("File path is not within the current working directory.");
		}
	});
});
