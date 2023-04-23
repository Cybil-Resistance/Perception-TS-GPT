import assert from "assert";
import fs from "fs";
import FileRead from "@src/operations/file_read";
import path from "path";

describe("Operations: Read a file", function () {
	before(function () {
		// Set the working directory before running any tests
		FileRead.setWorkingDirectory("./test/");
	});

	it("should read a file and return its contents", function () {
		const expectedContent = fs.readFileSync(path.resolve(process.cwd() + "/test/file_read.ts"), "utf-8");
		const actualContent = FileRead.run(path.resolve(process.cwd() + "/test/file_read.ts"));
		assert.strictEqual(actualContent, expectedContent);
	});

	it("should throw an error when the file path is outside of the working directory", function () {
		assert.throws(() => FileRead.run(path.resolve(process.cwd() + "../file_read.ts")), Error);
	});

	it("should throw an error when the file does not exist", function () {
		assert.throws(() => FileRead.run("nonExistentFile.txt"), Error);
	});

	it("should throw an error when the path is not a file", function () {
		assert.throws(() => FileRead.run("testFolder"), Error);
	});
});
