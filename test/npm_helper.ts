import { expect } from "chai";
import NpmHelper from "@src/operations/npm_helper";
import fs from "fs";

describe("Operations: NpmHelper", function () {
	before(function () {
		// Create test files within ./tmp/ folder
		if (!fs.existsSync("./tmp")) {
			fs.mkdirSync("./tmp");
		}
		fs.writeFileSync("./tmp/file1.js", "import chai from 'chai'; import mocha from 'mocha';");
		fs.writeFileSync("./tmp/file2.js", "const sinon = require('sinon');");
	});

	it("should return an array of imported packages", async function () {
		const filePaths = ["./tmp/file1.js", "./tmp/file2.js"];
		const importedPackages = await NpmHelper.run(filePaths);
		expect(importedPackages).to.deep.equal(["chai", "mocha", "sinon"]);
	});

	after(function () {
		// Remove test files from ./tmp/ folder
		fs.unlinkSync("./tmp/file1.js");
		fs.unlinkSync("./tmp/file2.js");
	});
});
