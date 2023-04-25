import { expect } from "chai";
import { config as cfg } from "@src/config";
import { Octokit } from "@octokit/rest";
import Git from "@src/operations/git";
import Github from "@src/operations/github";

describe("Operations: Github", function () {
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
		if (skipTests) {
			this.skip();
		}

		// Get the latest commit SHA from this branch
		const mainBranch = await Github.getBranch("main");
		await Github.createRemoteBranch(testBranchName, mainBranch.commit.sha);

		// Check that the branch was created
		const testBranch = await Github.getBranch(testBranchName);
		expect(testBranch.commit.sha).to.equal(mainBranch.commit.sha);
	});

	// Using the test branch created above, and the Git operations, create a commit, and push it to the test branch, create a PR
	it.skip("should create a commit and push it to the test branch", async function () {
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

		// Setup the repo
		const repoPath = process.cwd();
		Git.setRepo(repoPath);

		// Connect to the remote branch
		await Git.pull();
		await Git.checkout(testBranchName);

		// Add the files
		await Git.add(files);
		const diff = await Git.diff();
		expect(diff).to.not.be.empty;

		// Create the commit
		const message = "Automated Mocha test commit";
		await Git.commit(message);
		const status = await Git.status();
		expect(status.ahead).to.equal(1);

		// Push the commit



	});

	it.skip("should delete the test branch", async function () {
		if (skipTests) {
			this.skip();
		}

		await Github.deleteBranch(testBranchName);

		// Check that the branch no longer exists
		const branches = await Github.listBranches();
		for (const branch of branches) {
			expect(branch.name).to.not.equal(testBranchName);
		}
	});
});
