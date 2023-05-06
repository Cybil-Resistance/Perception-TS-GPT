import fs from "fs";
import { PromptCLI } from "@src/classes/prompt";
import DirectoryList from "@src/operations/directory_list";
import CodeAnalysisRoutine from "@src/routines/code_analysis";
import Git from "@src/operations/git";
import { BaseBotAdapter } from "@src/adapters/BaseBotAdapter";

export default class PerceptionBotAdapter extends BaseBotAdapter {
	public static homeDirectory: string = process.cwd() + "/home/codebot/";
	public static repositoryDirectory: string = process.cwd() + "/home/codebot/";

	public static getName(): string {
		return "Code Bot";
	}

	public static getDescription(): string {
		return "Work in a code repository";
	}

	public static async run(): Promise<void> {
		const prompt: string = await PromptCLI.select("What would you like to do?", [
			{ title: "Work in a code repository", value: "view-home" },
			{ title: "Set new home directory", value: "set-home" },
			{ title: "Exit", value: "back" },
		]);

		switch (prompt) {
			case "view-home":
				await this.viewHomeDirectory();
				break;
			case "set-home":
				await this.setHomeDirectory();
				break;
			default:
				return;
		}
	}

	private static async viewHomeDirectory(): Promise<void> {
		const filesAndFolders: object = await DirectoryList.run(this.homeDirectory);

		// Prompt the user to select a directory or file
		const prompt: string = await PromptCLI.select("Select a repository to connect to, or clone a new one:", [
			...Object.keys(filesAndFolders)
				.filter((key) => !filesAndFolders[key].type)
				.map((key: string) => {
					const fileData = filesAndFolders[key];
					return {
						title: key,
						value: key,
						description: fileData.type && fileData.type === "file" ? `Filetype: ${fileData.filetype}` : "",
					};
				}),
			{ title: "+ Clone new repository", value: "+" },
			{ title: "↩ Go back", value: null },
		]);

		if (!prompt) {
			this.run();
			return;
		} else if (prompt === "+") {
			// Prompt the user to enter a repository URL
			const repositoryUrl: string = await PromptCLI.text("Enter the repository URL:");
			let repositoryPath: string = await PromptCLI.text("Enter the new folder name:");

			// Check that the repository path doesn't already exist
			while (fs.existsSync(this.homeDirectory + "/" + repositoryPath)) {
				console.log("A folder with that name already exists.");
				repositoryPath = await PromptCLI.text("Enter the new folder name:");
			}

			// Clone the repository
			await Git.clone(repositoryUrl, this.homeDirectory + "/" + repositoryPath);
		} else {
			// Set the repository path
			this.repositoryDirectory = this.homeDirectory + "/" + prompt;
			await Git.setRepo(this.repositoryDirectory);
		}

		// Provide the user with options for the repository
		this.viewCodeOptions();
	}

	private static async setHomeDirectory(): Promise<void> {
		const prompt: string = await PromptCLI.text("Enter the home directory filepath for CodeBot:");
		this.homeDirectory = prompt;

		this.run();
	}

	private static async viewCodeOptions(): Promise<void> {
		const prompt: string = await PromptCLI.select("What would you like to do?", [
			{ title: "Get file structure", value: "view-files" },
			{ title: "Get code analysis for file", value: "view-code-analysis" },
			{ title: "Go back", value: "back" },
		]);

		switch (prompt) {
			case "view-files":
				await this.viewFiles();
				break;
			case "view-code-analysis":
				await this.viewCodeAnalysis();
				break;
			default:
				this.run();
				return;
		}
	}

	private static async viewFiles(): Promise<void> {
		CodeAnalysisRoutine.setRootDirectory(this.repositoryDirectory);
		console.log(JSON.stringify(CodeAnalysisRoutine.getProgramFiles(true), null, 2));

		this.viewCodeOptions();
	}

	private static async viewCodeAnalysis(): Promise<void> {
		const prompt: string = await PromptCLI.text("Enter the filepath of the file you would like to analyze:");
		console.log(JSON.stringify(CodeAnalysisRoutine.getCodeAnalysis(prompt), null, 2));

		this.viewCodeOptions();
	}

}
