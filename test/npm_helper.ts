import { expect } from "chai";
import NpmHelper from "@src/operations/npm_helper";
import fs from "fs";

describe("Operations: NpmHelper", function () {
	before(function () {
		// Create test files within ./tmp/ folder
		if (!fs.existsSync("./tmp")) {
			fs.mkdirSync("./tmp");
		}
		fs.writeFileSync("./tmp/file1.js", "import chai from 'chai'; import mocha from 'mocha'; import path from 'path';");
		fs.writeFileSync("./tmp/file2.js", "const sinon = require('sinon'); const fs = require('fs');");
	});

	it("should return an array of imported packages", async function () {
		const filePaths = ["./tmp/file1.js", "./tmp/file2.js"];
		const importedPackages = await NpmHelper.run(filePaths);
		expect(importedPackages).to.deep.equal(["chai", "mocha", "sinon"]);
	});

	it("should return an array of default built-in nodejs modules", async function () {
		const defaultModules = await NpmHelper.getBuiltInNodeModules();
		expect(defaultModules).to.include("assert");
		expect(defaultModules).to.include("fs");
		expect(defaultModules).to.include("path");
		expect(defaultModules).to.include("repl");
		expect(defaultModules).to.include("os");
	});

	after(function () {
		// Remove test files from ./tmp/ folder
		fs.unlinkSync("./tmp/file1.js");
		fs.unlinkSync("./tmp/file2.js");
	});
});
