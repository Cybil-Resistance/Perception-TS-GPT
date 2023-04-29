import fs from "fs";
import { PromptCLI } from "@src/classes/prompt";
import { OpenAI } from "@src/classes/llm";
import DirectoryList from "@src/operations/directory_list";
import Git from "@src/operations/git";
import { RequestMessage } from "@src/classes/request";

export default class PerceptionBotAdapter {
	public static homeDirectory: string = process.cwd() + "/home/codebot/";

	public static getName(): string {
		return "Code Bot";
	}

	public static getDescription(): string {
		return "A bot that can write code for you";
	}

	public static async run(): Promise<void> {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const prompt: string = await PromptCLI.select("What would you like to do?", [
				{ title: "Work in a code repository", value: "view-home" },
				{ title: "Set new home directory", value: "set-home" },
				{ title: "Test streaming output", value: "test" },
				{ title: "Go back", value: "back" },
			]);

			switch (prompt) {
				case "view-home":
					await this.viewHomeDirectory();
					break;
				case "set-home":
					await this.setHomeDirectory();
					break;
				case "test":
					await this.test();
					break;
				default:
					return;
			}
		}
	}

	private static async test(): Promise<void> {
		const openAI = new OpenAI();
		const requestMessage = new RequestMessage();
		requestMessage.addHistoryContext();
		requestMessage.addUserPrompt("What is the fastest bird in North America? And what about the slowest?");

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = requestMessage.generateMessages();

		// Get the response and handle it
		openAI.getCompletionStreaming((result: string) => {
			console.log("streaming:", result);
		}, messages);
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
			await Git.setRepo(this.homeDirectory + "/" + prompt);
		}

		// Provide the user with options for the repository
		console.log("options go here");
	}

	private static async setHomeDirectory(): Promise<void> {
		const prompt: string = await PromptCLI.text("Enter the home directory filepath for CodeBot:");
		this.homeDirectory = prompt;
	}
}
