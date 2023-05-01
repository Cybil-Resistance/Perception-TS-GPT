import { expect } from "chai";
import fs from "fs";
import path from "path";
import Git from "@src/operations/Git";

describe("Operations: Git Operations", function () {
	const repoUrl = "https://github.com/Cybil-Resistance/Perception-TS-GPT.git";
	const repoPath = path.resolve(process.cwd() + "/tmp/repo");
	const testBranchName = "mocha-automated-testing-dummy";

	before(function () {
		if (!fs.existsSync(repoPath)) {
			fs.mkdirSync(repoPath, { recursive: true });
		}
	});

	it("should return the correct name", function () {
		expect(Git.getName()).to.equal("Git Operations");
	});

	it("should clone the repository", async function () {
		await Git.clone(repoUrl, repoPath);
	});

	it("should set the repo path correctly", async function () {
		await Git.setRepo(repoPath);
		expect(Git.branchName).to.not.be.empty;

		// If there's an active diff, do not run this test
		const diff = await Git.diff();
		if (diff) {
			console.warn("There is an active diff, skipping some Git tests.");
			skipTests = true;
		}

		// If there's an active commit, do not run this test
		const status = await Git.status();
		if (status.ahead > 0) {
			console.warn("There is an active commit, skipping some Git tests.");
			skipTests = true;
		}
	});

	it("should get the current branches", async function () {
		const branch = await Git.branches();
		expect(branch).to.not.be.undefined;
	});

	it("should pull the latest changes", async function () {
		await Git.pull();
	});

	it("should checkout the test branch", async function () {
		await Git.checkout(testBranchName);
		const branch = await Git.branches();
		expect(branch).to.not.be.undefined;
		expect(branch.current).to.equal(testBranchName);
	});

	it("should add files to source control", async function () {
		const files = [`${repoPath}/test1.txt`, `${repoPath}/test2.txt`];
		const dummyText = "Lorem ipsum dolor sit amet\n";

		fs.appendFileSync(files[0], dummyText);
		fs.appendFileSync(files[1], dummyText);

		await Git.add(files);
	});

	it("should remove files from source control", async function () {
		const files = [`${repoPath}/test1.txt`, `${repoPath}/test2.txt`];

		await Git.rm(files);
	});

	it("should add the same files back to source control", async function () {
		const files = [`${repoPath}/test1.txt`, `${repoPath}/test2.txt`];
		const dummyText = "Lorem ipsum dolor sit amet\n";

		fs.appendFileSync(files[0], dummyText);
		fs.appendFileSync(files[1], dummyText);

		await Git.add(files);
	});

	it("should check the diff of the current changes against the current active remote branch", async function () {
		const diff = await Git.diff(["HEAD"]);
		expect(diff).to.not.be.empty;
	});

	it("should check the current status of the active source code", async function () {
		const status = await Git.status();
		expect(status).to.not.be.empty;
	});

	it("should commit the changes", async function () {
		const message = "Automated Mocha test commit";
		await Git.commit(message);
	});

	it("should push the changes", async function () {
		await Git.push();
	});

	it("should reset the changes", async function () {
		await Git.reset({ "--hard": null, "origin/main": null });
		//const status = await Git.status();
		//expect(status.ahead).to.equal(0); // The success criteria are not sufficient to test this properly
	});

	after(async function () {
		await Git.checkout("main");
		await Git.deleteLocalBranch(testBranchName, true);

		// Remove the test repository
		fs.rmSync(repoPath, { recursive: true });
	});
});
