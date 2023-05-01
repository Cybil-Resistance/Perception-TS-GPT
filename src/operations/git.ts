import BaseOperation, { OperationFormat } from "./base_operation";
import simpleGit, { SimpleGit, ResetOptions, StatusResult, BranchSummary, TaskOptions } from "simple-git";

/**
 * Operation Prompt: Using the Simple Git npm dependency, include static public functions that allow for setting the local repository to work from, a function to add files to source control, a function to check the diff of the current changes against the current active remote branch, a function to check the current status of the active source code, and a function to commit the changes.
 **/

export default class Git extends BaseOperation {
	private static git: SimpleGit;
	public static branchName: string;

	public static getName(): string {
		return "Git Operations";
	}

	public static getDescription(): string {
		return "Use git to manage source code.";
	}

	public static getOperations(): OperationFormat[] {
		return [
			{
				disabled: true,
				method: "clone_repository",
				call: this.clone,
				args: [
					{
						key: "repo_url",
						type: "string",
					},
				],
			},
		];
	}

	public static async clone(repoUrl: string, repoPath: string): Promise<void> {
		this.git = simpleGit();

		await this.git.clone(repoUrl, repoPath);
	}

	public static async setRepo(repoPath: string): Promise<void> {
		this.git = simpleGit(repoPath);

		// Iterate through the branches and find the current branch
		const branches = await this.branches();
		if (branches) {
			for (const branch in branches.branches) {
				if (branches.branches[branch].current) {
					this.branchName = branch;
					break;
				}
			}
		}
	}

	public static async add(files: string[]): Promise<void> {
		await this.git.add(files);
	}

	public static async rm(files: string[], keepLocal: boolean = true): Promise<void> {
		if (keepLocal) {
			await this.git.rmKeepLocal(files);
		} else {
			await this.git.rm(files);
		}
	}

	public static async diff(options?: TaskOptions): Promise<string> {
		return await this.git.diff(options);
	}

	public static async status(): Promise<StatusResult> {
		return await this.git.status();
	}

	public static async branches(): Promise<BranchSummary> {
		return await this.git.branch();
	}

	public static async pull(): Promise<void> {
		await this.git.pull();
	}

	public static async push(): Promise<void> {
		const remote = await this.git.getConfig("remote.origin.url");
		if (!remote) {
			throw new Error("No remote repository found.");
		}

		await this.git.push(remote.value, this.branchName);
	}

	public static async checkout(branchName: string): Promise<void> {
		// To be explicit about this
		const oldBranchName = this.branchName;
		this.branchName = branchName;

		// Checkout the branch, if it doesn't exist, then create it
		try {
			await this.git.checkout(this.branchName);
		} catch (ex) {
			await this.git.checkoutBranch(this.branchName, oldBranchName);
		}
	}

	public static async deleteLocalBranch(branchName: string, force: boolean = false): Promise<void> {
		await this.git.deleteLocalBranch(branchName, force);
	}

	public static async commit(message: string): Promise<void> {
		await this.git.commit(message);
	}

	public static async reset(options: ResetOptions = {}): Promise<void> {
		await this.git.reset(options);
	}
}
