import fs from "fs";
import { config as cfg } from "@src/config";
import { PromptCLI } from "@src/classes/prompt";
import DirectoryList from "@src/operations/directory_list";
import CodeAnalysisRoutine from "@src/routines/code_analysis";
import Git from "@src/operations/git";
import { BaseBotAdapter } from "@src/adapters/BaseBotAdapter";
import { OpenAI } from "@src/classes/llm";
import { RequestMessage } from "@src/classes/request";
import { ChatCompletionResponseMessage } from "openai";
import { FILE_LIST, FILE_CONTENTS, CREATE_OPERATION, EDIT_OPERATION } from "./config/prompts";
import highlight from "cli-highlight";
import path from "path";
import { FileWrite } from "@src/operations";
import State from "@src/classes/state/State";

export default class PerceptionBotAdapter extends BaseBotAdapter {
	public static state: State;

	public static getName(): string {
		return "Code Bot";
	}

	public static getDescription(): string {
		return "Work in a code repository";
	}

	public static async run(state: State): Promise<void> {
		// Save the state
		this.state = state;

		// Get the home directory from the state
		const { homeDirectory } = this.state.getProgramState("codebot");

		// Report to the user
		console.log("Home directory: " + homeDirectory);

		// Determine if we can find the home directory
		if (!homeDirectory) {
			// Prompt the user to set the home directory
			this.setHomeDirectory();
		} else {
			// Enter the main menu
			this.mainMenu();
		}
	}

	public static async mainMenu(): Promise<void> {
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
		// Get the home directory from the state
		const { homeDirectory } = this.state.getProgramState("codebot");

		const filesAndFolders: object = await DirectoryList.run(homeDirectory);

		// Prompt the user to select a directory or file
		const prompt: string = await PromptCLI.select("Select a repository to connect to, or clone a new one:", [
			...Object.keys(filesAndFolders)
				.filter((key) => filesAndFolders[key].type == "directory")
				.map((key: string) => {
					return {
						title: key,
						value: key,
					};
				}),
			{ title: "+ Clone new repository", value: "+" },
			{ title: "↩ Go back", value: null },
		]);

		if (!prompt) {
			this.mainMenu();
			return;
		} else if (prompt === "+") {
			// Prompt the user to enter a repository URL
			const repositoryUrl: string = await PromptCLI.text("Enter the repository URL:");
			let repositoryPath: string = await PromptCLI.text("Enter the new folder name:");

			// Check that the repository path doesn't already exist
			while (fs.existsSync(homeDirectory + "/" + repositoryPath)) {
				console.log("A folder with that name already exists.");
				repositoryPath = await PromptCLI.text("Enter the new folder name:");
			}

			const repositoryDirectory = homeDirectory + "/" + repositoryPath;

			// Save the repositoryDirectory to the state
			this.state.setProgramState("codebot", { repositoryDirectory });

			// Clone the repository
			await Git.clone(repositoryUrl, repositoryDirectory);
		} else {
			const repositoryDirectory = homeDirectory + "/" + prompt;

			// Save the repositoryDirectory to the state
			this.state.setProgramState("codebot", { repositoryDirectory });

			// Set the repository
			await Git.setRepo(repositoryDirectory);
		}

		// Provide the user with options for the repository
		this.viewCodeOptions();
	}

	private static async setHomeDirectory(): Promise<void> {
		let homeDirectory: string;
		do {
			homeDirectory = await PromptCLI.text("Enter the home directory filepath for CodeBot:");

			if (!fs.existsSync(homeDirectory)) {
				console.log("Chosen directory (" + homeDirectory + ") does not exist.");
			} else {
				// Save the home directory to the state
				this.state.setProgramState("codebot", { homeDirectory });
			}
		} while (!fs.existsSync(homeDirectory));

		this.mainMenu();
	}

	private static async viewCodeOptions(): Promise<void> {
		const prompt: string = await PromptCLI.select("What would you like to do?", [
			{ title: "Create new file", value: "create-file" },
			{ title: "Edit existing file", value: "edit-file" },
			{ title: "Debug: Get file structure", value: "view-files" },
			{ title: "Debug: Get code analysis for file", value: "view-code-analysis" },
			{ title: "Go back", value: "back" },
		]);

		// Get the repository directory from the state
		const { repositoryDirectory } = this.state.getProgramState("codebot");

		switch (prompt) {
			case "view-files":
				this.viewFiles();
				break;
			case "view-code-analysis":
				this.navigateFileStructure(repositoryDirectory, true, this.viewCodeAnalysis.bind(this));
				break;
			case "create-file":
				this.createOperation();
				break;
			case "edit-file":
				this.editOperation();
				break;
			default:
				this.mainMenu();
				return;
		}
	}

	private static async operationLoop(content: string, referenceFiles?: string[], filepath?: string, filename?: string): Promise<void> {
		// Check if the user wants to save the operation
		const nextOperation: string = await PromptCLI.select("Would you like to do next?", [
			{ title: "Save File", value: "save" },
			{ title: "Edit File", value: "edit" },
			{ title: "Try Again", value: "retry" },
			{ title: "Cancel", value: "cancel" },
		]);

		// Get the repository directory from the state
		const { repositoryDirectory } = this.state.getProgramState("codebot");

		if (nextOperation === "save") {
			if (filepath) {
				this.promptFileSave(content, filepath, filename);
			} else {
				this.navigateFileStructure(repositoryDirectory, false, this.promptFileSave.bind(this, content));
			}
		} else if (nextOperation === "edit") {
			this.editOperation(content, referenceFiles, filepath, filename);
		} else if (nextOperation === "retry") {
			this.createOperation();
			return;
		}
	}

	private static async createOperation(referenceFiles?: string[]): Promise<void> {
		// Prompt the user for their desired operation
		const includeReferenceFile: boolean = await PromptCLI.confirm("Do you want to add a file for reference?");

		// Get the repository directory from the state
		const { repositoryDirectory } = this.state.getProgramState("codebot");

		// If the user wants to use a reference file, prompt them for it
		if (includeReferenceFile) {
			this.navigateFileStructure(repositoryDirectory, true, (filename) => {
				referenceFiles = (referenceFiles || []).concat([filename]);
				this.createOperation(referenceFiles);
			});
		} else {
			this.createOperationLoop(referenceFiles);
		}
	}

	private static async createOperationLoop(referenceFiles?: string[]): Promise<void> {
		// Prompt the user for their desired operation
		//const nameOfClass: string = await PromptCLI.text("What would you like to name the class?");
		const details: string = await PromptCLI.multiline("Detail the new file's contents:");

		// If nothing is provided, exit
		if (details.trim() === "") {
			this.viewCodeOptions();
			return;
		}

		// Construct system messages
		const systemPrompts: string[] = await this.constructSystemPrompts(referenceFiles);

		// Construct the request message
		const response = await this.callOpenAi(systemPrompts, CREATE_OPERATION.replaceAll("{{DETAILS}}", details));

		// Clean the code result
		const codeBlock: string = this.cleanCodeResponse(response);

		// Report the response to the user
		this.clearConsole();
		this.printCode(codeBlock);

		// Enter the operation loop
		await this.operationLoop(codeBlock, referenceFiles);
	}

	private static async editOperation(content?: string, referenceFiles?: string[], filepath?: string, filename?: string): Promise<void> {
		// Get the repository directory from the state
		const { repositoryDirectory } = this.state.getProgramState("codebot");

		// If there is no content, we need to fetch the first file
		if (!content) {
			this.navigateFileStructure(repositoryDirectory, true, (_filename) => {
				const content = fs.readFileSync(_filename, "utf-8");
				this.printCode(content);
				this.editOperation(content, referenceFiles, path.dirname(_filename), path.basename(_filename));
			});
			return;
		}

		// Prompt the user for their desired operation
		const includeReferenceFile: boolean = await PromptCLI.confirm("Do you want to add a file for reference?");

		// If the user wants to use a reference file, prompt them for it
		if (includeReferenceFile) {
			this.navigateFileStructure(repositoryDirectory, true, (filename) => {
				referenceFiles = (referenceFiles || []).concat([filename]);
				this.editOperation(content, referenceFiles, filepath, filename);
			});
		} else {
			this.editOperationLoop(content, referenceFiles, filepath, filename);
		}
	}

	private static async editOperationLoop(
		content: string,
		referenceFiles?: string[],
		filepath?: string,
		filename?: string,
	): Promise<ChatCompletionResponseMessage | void> {
		// Prompt the user for the edits they want to make
		const edits: string = await PromptCLI.multiline("What edits would you like to make? (Enter nothing to return to previous menu)");

		// If nothing is provided, exit
		if (edits.trim() === "") {
			this.operationLoop(content, referenceFiles, filepath, filename);
			return;
		}

		// Construct system messages
		const systemPrompts: string[] = await this.constructSystemPrompts(referenceFiles);

		// Construct the request message
		const response = await this.callOpenAi(
			systemPrompts,
			EDIT_OPERATION.replaceAll("{{EDITS}}", edits).replaceAll("{{CODE}}", content),
		);

		// Clean the code result
		const codeBlock: string = this.cleanCodeResponse(response);

		// Report the response to the user
		this.clearConsole();
		this.printCode(codeBlock);

		// Enter the operation loop
		this.operationLoop(codeBlock, referenceFiles, filepath, filename);
	}

	private static async constructSystemPrompts(referenceFiles?: string[]): Promise<string[]> {
		// Construct system messages
		const systemPrompts: string[] = [FILE_LIST.replaceAll("{{FILE_LIST}}", await this.getFiles())];

		if (referenceFiles) {
			for (const referenceFile of referenceFiles) {
				// Get the file contents for the reference file
				systemPrompts.push(
					FILE_CONTENTS.replaceAll("{{FILE_PATH}}", referenceFile).replaceAll(
						"{{FILE_CONTENTS}}",
						fs.readFileSync(referenceFile, "utf-8"),
					),
				);
			}
		}

		return systemPrompts;
	}

	private static cleanCodeResponse(response: ChatCompletionResponseMessage): string {
		// Extract the codeblock if it was wrapped in a code block
		let codeBlock = response.content;

		// Remove the initial start of a code block, including any language specification
		codeBlock = codeBlock.replace(/```[^\n\r]*/, "");

		// If the code block now starts with whitespace, remove it
		codeBlock = codeBlock.replace(/^\s*/, "");

		// Remove the end of the code block
		const lastIndex = codeBlock.lastIndexOf("```");
		if (lastIndex !== -1) {
			codeBlock = codeBlock.substring(0, lastIndex);
		}

		return codeBlock;
	}

	// Emulate a file explorer using PromptCLI and the file structure
	private static async navigateFileStructure(
		currentDirectory: string,
		includeFiles: boolean = true,
		callback: (filePath: string) => void,
	): Promise<void> {
		const filesAndFolders: object = await DirectoryList.run(currentDirectory);

		let promptTitle = "Select a directory:";
		if (includeFiles) {
			promptTitle = "Select a file:";
		}

		// Construct the options
		const options = [
			{ title: "..", value: ".." },
			...Object.keys(filesAndFolders)
				.map((key: string) => {
					const fileData = filesAndFolders[key];

					if (!includeFiles && fileData.type === "file") {
						return null;
					}

					return {
						title: key,
						value: key,
						description: fileData.type && fileData.type === "file" ? `Filetype: ${fileData.filetype}` : "",
					};
				})
				.filter((option) => !!option),
			{ title: "↩ Go back", value: null },
		];

		// If we're including files, then add the option to select the current directory
		if (!includeFiles) {
			options.splice(options.length - 1, 0, { title: "-- Select current directory --", value: "." });
		}

		// Prompt the user to select a directory or file
		const prompt: string = await PromptCLI.select(promptTitle, options);

		if (!prompt) {
			this.viewCodeOptions();
			return;
		} else if (prompt === "..") {
			// Move to the parent directory
			currentDirectory = currentDirectory.split("/").slice(0, -1).join("/");
		} else if (prompt === ".") {
			// Move to the next command
			callback(currentDirectory);
			return;
		} else if (filesAndFolders[prompt].type === "file") {
			// Move to the next command
			callback(currentDirectory + "/" + prompt);
			return;
		} else if (filesAndFolders[prompt].type === "directory") {
			// Move to the next directory
			currentDirectory += "/" + prompt;
		}

		this.navigateFileStructure(currentDirectory, includeFiles, callback);
	}

	private static async getFiles(): Promise<string> {
		// Get the repository directory from the state
		const { repositoryDirectory } = this.state.getProgramState("codebot");
		CodeAnalysisRoutine.setRootDirectory(repositoryDirectory);
		return CodeAnalysisRoutine.listFilePaths(CodeAnalysisRoutine.getProgramFiles(true), "").join("\n");
	}

	private static async viewFiles(): Promise<void> {
		console.log(await this.getFiles());

		this.viewCodeOptions();
	}

	private static async getCodeAnalysis(filePath: string): Promise<object> {
		return CodeAnalysisRoutine.listCodeAnalysis(filePath);
	}

	private static async viewCodeAnalysis(filePath: string): Promise<void> {
		console.log(JSON.stringify(await this.getCodeAnalysis(filePath), null, 2));

		this.viewCodeOptions();
	}

	private static async callOpenAi(systemPrompts: string[], userPrompt: string): Promise<ChatCompletionResponseMessage> {
		const openAI = new OpenAI();
		const requestMessage = new RequestMessage();

		// Construct the request message
		if (systemPrompts.length > 0) {
			for (const systemPrompt of systemPrompts) {
				requestMessage.addSystemPrompt(systemPrompt);
			}
		}

		requestMessage.addUserPrompt(userPrompt);

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = requestMessage.generateMessages();

		//console.log(messages);
		console.log("Current expected token use:", requestMessage.estimateCurrentTokenUse());

		// Get the response and handle it
		const response = await openAI.getCompletion({
			messages,
			model: cfg.FAST_LLM_MODEL,
			onMessageCallback: (response) => {
				process.stdout.write(response);
			},
		});

		// Store GPT's reponse
		requestMessage.addGPTResponse(response);

		return response;
	}

	private static printCode(code: string): void {
		console.log(highlight(code, { language: "typescript", ignoreIllegals: true }));
	}

	private static clearConsole(): void {
		//console.clear();
	}

	private static async promptFileSave(content: string, filepath?: string, filename?: string): Promise<void> {
		// If we don't have a filename, prompt the user for one
		if (!filename) {
			// Prompt the user for the filename
			filename = await PromptCLI.text("What would you like to name the file? (include the extension)");
		} else {
			console.log(`Saving file: ${filename}`);
		}

		// For this filename, strip any slashes
		filename = filename.replaceAll("/", "");

		// Save the operation
		FileWrite.setWorkingDirectory(path.resolve(filepath));
		FileWrite.run(path.resolve(filepath, filename), content);

		// Log the filename
		console.log(`Saved file: ${filename}`);

		this.viewCodeOptions();
	}
}
