import { config as cfg } from "@src/config";
import { Octokit } from "@octokit/rest";
import { PromptCLI } from "@src/classes/prompt";

/**
 * Operation: Commit changes to Github repository
 *
 * This operation connects to Github via nodeJS API, using the config-exposed variables called GITHUB_API_KEY and GITHUB_USERNAME,
 * shows the current diff, prompts the user using PromptCLI for a commit message, and commits the changes.
 **/

export default class GithubCommit {
	private static branch: string = "main";
	private static repoName: string;

	public static getName(): string {
		return "Commit Changes to Github";
	}

	public static getDescription(): string {
		return "Connects to Github via nodeJS API, shows the current diff, prompts the user for a commit message, and commits the changes.";
	}

	public static async run(): Promise<void> {
		// Connect to Github API
		const octokit = new Octokit({
			auth: cfg.GITHUB_API_KEY,
			userAgent: cfg.GITHUB_USERNAME,
		});

		// Get current diff
		const diff = await octokit.repos.compareCommits({
			owner: cfg.GITHUB_USERNAME,
			repo: this.repoName,
			base: this.branch,
			head: this.branch,
		});

		// Prompt user for commit message
		const commitMessage = await PromptCLI.text("Enter commit message:");

		// Commit changes
		await octokit.git.createCommit({
			repo: this.repoName,
			message: commitMessage,
			tree: diff.data.base_commit.tree.sha,
			head: this.branch,
		});
	}

	public static setHead(head: string): void {
		this.branch = head;
	}

	public static setRepoName(repoName: string): void {
		this.repoName = repoName;
	}
}
