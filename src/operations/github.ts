import { config as cfg } from "@src/config";
import { Octokit } from "@octokit/rest";
import { PromptCLI } from "@src/classes/prompt";

/**
 * Operation: Github API wrapper
 **/

export default class Github {
	private static branch: string = "main";
	private static repoName: string;
	private static ownerName: string;

	public static getName(): string {
		return "Github API Wrapper";
	}

	public static getDescription(): string {
		return "Github features: create branch, switch branch, commit changes.";
	}

	public static setBranch(branch: string): void {
		this.branch = branch;
	}

	public static setRepoName(repoName: string): void {
		this.repoName = repoName;
	}

	public static setOwnerName(ownerName: string): void {
		this.ownerName = ownerName;
	}

	public static async commit(): Promise<void> {
		// Connect to Github API
		const octokit = new Octokit({
			auth: cfg.GITHUB_API_KEY,
			userAgent: cfg.GITHUB_USERNAME,
		});

		// Get current diff
		const diff = await octokit.repos.compareCommits({
			owner: this.ownerName,
			repo: this.repoName,
			base: this.branch,
			head: this.branch,
		});

		// Prompt user for commit message
		const commitMessage = await PromptCLI.text("Enter commit message:");

		// Create commit
		await octokit.git.createCommit({
			owner: this.ownerName,
			repo: this.repoName,
			message: commitMessage,
			tree: diff.data.base_commit.tree.sha,
			head: this.branch,
		});
	}

	public static async getBranch(branch: string): Promise<any> {
		const { GITHUB_API_KEY } = cfg;
		const octokit = new Octokit({
			auth: GITHUB_API_KEY,
		});

		try {
			const { data } = await octokit.rest.repos.getBranch({
				owner: this.ownerName,
				repo: this.repoName,
				branch,
			});
			return data;
		} catch (error) {
			console.error(error);
			return "";
		}
	}

	public static async switchBranch(branchName: string, commitSHA: string): Promise<void> {
		const { GITHUB_API_KEY } = cfg;
		const octokit = new Octokit({
			auth: GITHUB_API_KEY,
		});

		try {
			await octokit.rest.git.updateRef({
				owner: this.ownerName,
				repo: this.repoName,
				ref: `heads/${branchName}`,
				sha: commitSHA,
				force: true,
			});
			console.log(`Switched to branch: ${branchName}`);
			this.setBranch(branchName);
		} catch (error) {
			console.error(error);
		}
	}

	public static async listBranches(): Promise<string[]> {
		const { GITHUB_API_KEY } = cfg;
		const octokit = new Octokit({
			auth: GITHUB_API_KEY,
		});

		try {
			const response = await octokit.rest.repos.listBranches({
				owner: this.ownerName,
				repo: this.repoName,
			});
			return response.data;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	public static async getBaseBranch(branchName: string): Promise<void> {
		const { GITHUB_API_KEY } = cfg;
		const octokit = new Octokit({
			auth: GITHUB_API_KEY,
		});

		const baseBranchRef = await octokit.rest.git.getRef({
			owner: this.ownerName,
			repo: this.repoName,
			ref: `heads/${branchName}`,
		});

		return baseBranchRef;
	}

	public static async createAndPushBranch(branchName: string, commitSHA: string): Promise<void> {
		const { GITHUB_API_KEY } = cfg;
		const octokit = new Octokit({
			auth: GITHUB_API_KEY,
		});

		try {
			await octokit.rest.git.createRef({
				owner: this.ownerName,
				repo: this.repoName,
				ref: `refs/heads/${branchName}`,
				sha: commitSHA,
			});
			console.log(`Created and pushed new branch: ${branchName}`);

			this.setBranch(branchName);
		} catch (error) {
			console.error(error);
		}
	}
}
