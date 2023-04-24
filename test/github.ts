import { expect } from "chai";
import { config as cfg } from "@src/config";
import { Octokit } from "@octokit/rest";
//import { PromptCLI } from "@src/classes/prompt";
import Github from "@src/operations/github";

describe("Operations: Github", function () {
	it("should set the head branch correctly", function () {
		Github.setBranch("main");
		expect(Github["branch"]).to.equal("main");
	});

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
			base: Github["branch"],
			head: Github["branch"],
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

	it.skip("should create and push a test branch", async function () {
		// Get the latest commit SHA from this branch
		const mainBranch = await Github.getBaseBranch("main");
		await Github.createAndPushBranch("test", mainBranch.data.object.sha);

		// Check that the branch was created
		//const testBranch = await Github.getBranch("test");
		//expect(testBranch.commit.sha).to.equal(mainBranch.commit.sha);
	});
});
