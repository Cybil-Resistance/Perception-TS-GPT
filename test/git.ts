import { expect } from "chai";
import fs from "fs";

import Git from "@src/operations/Git";

describe("Operations: Git Operations", function () {
	let skipTests: boolean = false;
	const testBranchName = "mocha-automated-testing-dummy";

	before(async function () {
		const repoPath = process.cwd();
		Git.setRepo(repoPath);

		// If there's an active diff, do not run this test
		const diff = await Git.diff();
		if (diff) {
			console.log("There is an active diff, skipping some Git tests.");
			skipTests = true;
		}

		// If there's an active commit, do not run this test
		const status = await Git.status();
		if (status.ahead > 0) {
			console.log("There is an active commit, skipping some Git tests.");
			skipTests = true;
		}
	});

	it("should return the correct name", function () {
		expect(Git.getName()).to.equal("Git Operations");
	});

	it("should return the correct description", function () {
		expect(Git.getDescription()).to.equal("A class that performs Git operations using the Simple Git npm dependency.");
	});

	it("should set the repo path correctly", function () {
		const repoPath = process.cwd();
		Git.setRepo(repoPath);
		expect(Git.branchName).to.not.be.empty;
	});

	it("should get the current branches", async function () {
		const branch = await Git.branches();
		expect(branch).to.not.be.undefined;
	});

	it("should checkout the test branch", async function () {
		if (skipTests) {
			this.skip();
		}

		await Git.checkout(testBranchName);
		const branch = await Git.branches();
		expect(branch).to.not.be.undefined;
		expect(branch.current).to.equal(testBranchName);
	});

	it("should add files to source control", async function () {
		if (skipTests) {
			this.skip();
		}

		const files = ["./tmp/test1.txt", "./tmp/test2.txt"];
		const dummyText = "Lorem ipsum dolor sit amet";

		if (!fs.existsSync("tmp")) {
			fs.mkdirSync("tmp");
		}

		fs.writeFileSync(files[0], dummyText);
		fs.writeFileSync(files[1], dummyText);

		await Git.add(files);
		const diff = await Git.diff();
		expect(diff).to.not.be.empty;
	});

	it("should check the diff of the current changes against the current active remote branch", async function () {
		if (skipTests) {
			this.skip();
		}

		const diff = await Git.diff();
		expect(diff).to.not.be.empty;
	});

	it("should check the current status of the active source code", async function () {
		if (skipTests) {
			this.skip();
		}

		const status = await Git.status();
		expect(status).to.not.be.empty;
	});

	it("should commit to a test branch", async function () {
		if (skipTests) {
			this.skip();
		}

		await Git.commit("Automated Mocha test commit", testBranchName);
		const status = await Git.status();
		expect(status.ahead).to.equal(1);
	});

	it("should commit the changes", async function () {
		if (skipTests) {
			this.skip();
		}

		const message = "Automated Mocha test commit";
		await Git.commit(message);
		const status = await Git.status();
		expect(status.ahead).to.equal(1);
	});

	it("should reset the changes", async function () {
		if (skipTests) {
			this.skip();
		}

		await Git.reset({ "--hard": null, "origin/main": null });
		const status = await Git.status();
		expect(status.ahead).to.equal(0);
	});
});
