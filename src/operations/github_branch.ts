import { config as cfg } from "@src/config";
import { Octokit } from "@octokit/rest";
//import { PromptCLI } from "@src/classes/prompt";

// This file contains a class that connects to Github via nodeJS API and provides functions to interact with branches in a repository.

export default class GithubBranch {
	private static repoName: string;

	public static getName(): string {
		return "Github Branch";
	}

	public static getDescription(): string {
		return "Connects to Github via nodeJS API and provides functions to interact with branches in a repository.";
	}

	public static async getCurrentBranch(): Promise<string> {
		const { GITHUB_API_KEY, GITHUB_USERNAME } = cfg;
		const octokit = new Octokit({
			auth: GITHUB_API_KEY,
		});

		try {
			const { data: currentBranch } = await octokit.rest.repos.getBranch({
				owner: GITHUB_USERNAME,
				repo: this.repoName,
			});
			return currentBranch.name;
		} catch (error) {
			console.error(error);
			return "";
		}
	}

	public static async switchBranch(branchName: string, commitSHA: string): Promise<void> {
		const { GITHUB_API_KEY, GITHUB_USERNAME } = cfg;
		const octokit = new Octokit({
			auth: GITHUB_API_KEY,
		});

		try {
			await octokit.rest.git.updateRef({
				owner: GITHUB_USERNAME,
				repo: this.repoName,
				ref: `heads/${branchName}`,
				sha: commitSHA,
				force: true,
			});
			console.log(`Switched to branch: ${branchName}`);
		} catch (error) {
			console.error(error);
		}
	}

	public static async listBranches(): Promise<string[]> {
		const { GITHUB_API_KEY, GITHUB_USERNAME } = cfg;
		const octokit = new Octokit({
			auth: GITHUB_API_KEY,
		});

		try {
			const { data: allBranches } = await octokit.rest.repos.listBranches({
				owner: GITHUB_USERNAME,
				repo: this.repoName,
			});
			return allBranches.map((branch) => branch.name);
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	public static setRepoName(repoName: string): void {
		this.repoName = repoName;
	}
}
