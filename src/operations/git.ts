import simpleGit, { SimpleGit, ResetOptions, StatusResult } from "simple-git";

/**
 * Operation Prompt: Using the Simple Git npm dependency, include static public functions that allow for setting the local repository to work from, a function to add files to source control, a function to check the diff of the current changes against the current active remote branch, a function to check the current status of the active source code, and a function to commit the changes.
 **/

export default class Git {
	private static git: SimpleGit;

	public static getName(): string {
		return "Git Operations";
	}

	public static getDescription(): string {
		return "A class that performs Git operations using the Simple Git npm dependency.";
	}

	public static setRepo(repoPath: string): void {
		this.git = simpleGit(repoPath);
	}

	public static async add(files: string[]): Promise<void> {
		await this.git.add(files);
	}

	public static async rm(files: string[], keepLocal:boolean = true): Promise<void> {
		if (keepLocal) {
			await this.git.rmKeepLocal(files);
		} else {
			await this.git.rm(files);
		}
	}

	public static async diff(): Promise<string> {
		return await this.git.diff(["HEAD"]);
	}

	public static async status(): Promise<StatusResult> {
		return await this.git.status();
	}

	public static async commit(message: string): Promise<void> {
		await this.git.commit(message);
	}

	public static async reset(options: ResetOptions = {}): Promise<void> {
		await this.git.reset(options);
	}
}
