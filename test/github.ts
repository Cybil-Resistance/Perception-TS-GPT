import { expect } from "chai";
import { config as cfg } from "@src/config";
import { Octokit } from "@octokit/rest";
import Github from "@src/operations/github";

describe("Operations: Github", function () {
	it("should set the repo owner correctly", function () {
		Github.setOwnerName("Cybil-Resistance");
		expect(Github["ownerName"]).to.equal("Cybil-Resistance");
	});

	it("should set the repo name correctly", function () {
		Github.setRepoName("Perception-TS-GPT");
		expect(Github["repoName"]).to.equal("Perception-TS-GPT");
	});

	it("should connect to Github API and get current diff", async function () {
		const octokit = new Octokit({
			auth: cfg.GITHUB_API_KEY,
			userAgent: cfg.GITHUB_USERNAME,
		});

		const diff = await octokit.repos.compareCommits({
			owner: Github["ownerName"],
			repo: Github["repoName"],
			base: "main",
			head: "main",
		});
		expect(diff).to.not.be.undefined;
		expect(diff).to.have.property("data");
		expect(diff.data).to.have.property("status");
		expect(diff.data.status).to.equal("identical");
	});

	it("should list available branches", async function () {
		const branches = await Github.listBranches();
		expect(branches).to.not.be.undefined;
		expect(branches).to.be.an("array");
		expect(branches[0]).to.have.property("name");
		expect(branches[0]["name"]).to.equal("main");
	});

	/**
	 * These might be a little heavy on the github API, so sometimes worth skipping
	 **/

	it.skip("should create and push a test branch - make sure your user has write access to the repo", async function () {
		// Get the latest commit SHA from this branch
		const mainBranch = await Github.getBranch("main");
		await Github.createRemoteBranch("mocha-automated-testing-dummy", mainBranch.commit.sha);

		// Check that the branch was created
		const testBranch = await Github.getBranch("mocha-automated-testing-dummy");
		expect(testBranch.commit.sha).to.equal(mainBranch.commit.sha);
	});

	// here is where we want to create a commit, send it, create a PR, and delete the PR, then delete the branch

	it.skip("should delete the test branch", async function () {
		await Github.deleteBranch("mocha-automated-testing-dummy");

		// Check that the branch no longer exists
		const branches = await Github.listBranches();
		for (const branch of branches) {
			expect(branch.name).to.not.equal("mocha-automated-testing-dummy");
		}
	});
});
