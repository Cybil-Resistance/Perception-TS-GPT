import { config as cfg } from "@src/config";
import { Octokit } from "@octokit/rest";

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

	public static setRepoName(repoName: string): void {
		this.repoName = repoName;
	}

	public static setOwnerName(ownerName: string): void {
		this.ownerName = ownerName;
	}

	/*
	public static async commit(commitMessage:string, branch?: string): Promise<void> {
		// Connect to Github API
		const octokit = new Octokit({
			auth: cfg.GITHUB_API_KEY,
			userAgent: cfg.GITHUB_USERNAME,
		});

		const currentCommit = await octokit.git.getCommit({
			owner: this.ownerName,
			repo: this.repoName,
			commit_sha: newBranchRef.data.object.sha,
		});

		const newCommit = await octokit.git.createCommit({
			owner,
			repo,
			message: commitMessage,
			tree: currentCommit.data.tree.sha,
			parents: [currentCommit.data.sha],
		});

		// Create commit
		await octokit.git.createCommit({
			owner: this.ownerName,
			repo: this.repoName,
			message: commitMessage,
			tree: diff.data.base_commit.tree.sha,
			head: this.branch,
		});
	}
	*/

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

	public static async createRemoteBranch(branchName: string, commitSHA: string): Promise<void> {
		const octokit = new Octokit({
			auth: cfg.GITHUB_API_KEY,
			userAgent: cfg.GITHUB_USERNAME,
		});

		try {
			await octokit.git.createRef({
				owner: this.ownerName,
				repo: this.repoName,
				ref: `refs/heads/${branchName}`,
				sha: commitSHA,
			});
		} catch (error) {
			console.error(error);
		}
	}

	public static async deleteBranch(branchName: string): Promise<void> {
		const octokit = new Octokit({
			auth: cfg.GITHUB_API_KEY,
			userAgent: cfg.GITHUB_USERNAME,
		});

		try {
			await octokit.git.deleteRef({
				owner: this.ownerName,
				repo: this.repoName,
				ref: `heads/${branchName}`,
			});
		} catch (error) {
			console.error(error);
		}
	}
}
