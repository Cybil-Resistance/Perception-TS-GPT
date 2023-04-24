import { ChatCompletionResponseMessage } from "openai";
import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";
import { FileRead, FileWrite } from "@src/operations";
import { CREATE_OPERATION, EDIT_OPERATION, CREATE_TEST_OPERATION, EDIT_TEST_OPERATION } from "./config/prompts";
import path from "path";
import fs from "fs";
import highlight from "cli-highlight";

export default class PerceptionBotAdapter {
	public static getName(): string {
		return "Perception Bot";
	}

	public static getDescription(): string {
		return "This bot, with the power to edit and amend itself";
	}

	public static async run(): Promise<void> {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			// Prompt the user for what action they want the Perception Bot to perform:
			// - Whether they want to create a new operation
			// - Whether they want to edit an existing operation
			// - Whether they want to create a mocha test for an existing operation
			const prompt: string = await PromptCLI.select("What would you like to do?", [
				{ title: "Create a new operation", value: "create" },
				{ title: "Edit an existing operation", value: "edit" },
				{ title: "Create or edit a mocha test for an existing operation", value: "test" },
				{ title: "Go back", value: "back" },
			]);

			switch (prompt) {
				case "create":
					await this.createOperation();
					break;
				case "edit":
					await this.editOperation();
					break;
				case "test":
					await this.createTestOperation();
					break;
				default:
					return;
			}
		}
	}

	private static async createOperation(): Promise<void> {
		// Prompt the user for their desired operation
		const nameOfClass: string = await PromptCLI.text("What would you like to name the class?");
		const funcOfOperation: string = await PromptCLI.text("What function should the operation perform?");

		let runOperation = true;
		while (runOperation) {
			// Assume that the operation will complete, unless the user says otherwise
			runOperation = false;

			// Construct the request message
			const response = await this.callOpenAi(
				CREATE_OPERATION.replaceAll("{{CLASS_NAME}}", nameOfClass).replaceAll("{{OPERATION}}", funcOfOperation),
			);

			// Report the response to the user
			this.clearConsole();
			this.printCode(response.content);

			// Enter the operation loop
			await this.operationLoop(response.content);
		}
	}

	private static async editOperation(): Promise<void> {
		// Get all of the current operations
		const operations: string[] = await this.getOperationsFilenames();

		// Prompt the user for the operation they want to edit
		const operation: string = await PromptCLI.select(
			"Which operation would you like to edit?",
			operations.map((op) => {
				return { title: op, value: op };
			}),
		);

		// Read and display the current file
		FileRead.setWorkingDirectory(path.resolve(process.cwd() + "/src/operations"));
		const file: string = FileRead.run(operation);

		this.clearConsole();
		this.printCode(file);

		const response = await this.promptFileEdit(file);
		if (!response) {
			return;
		}

		// Display the latest response & enter the operation loop
		this.clearConsole();
		this.printCode(response.content);
		await this.operationLoop(response.content, operation);
	}

	private static async createTestOperation(): Promise<void> {
		// Get all of the current operations
		const operations: string[] = await this.getOperationsFilenames();

		// Prompt the user for the operation they want to edit
		const operation: string = await PromptCLI.select(
			"Which operation would you like to add or edit tests for?",
			operations.map((op) => {
				return { title: op, value: op };
			}),
		);

		// Read the current file
		FileRead.setWorkingDirectory(path.resolve(process.cwd() + "/src/operations"));
		const file: string = FileRead.run(operation);

		// Determine if tests already exist for this operation
		let openAiContext = CREATE_TEST_OPERATION.replaceAll("{{CODE}}", file);
		if (fs.existsSync(path.resolve(process.cwd() + "/test/" + operation))) {
			// Read the test file
			FileRead.setWorkingDirectory(path.resolve(process.cwd() + "/test/"));
			const testFile: string = FileRead.run(operation);

			openAiContext = EDIT_TEST_OPERATION.replaceAll("{{CODE}}", file).replaceAll("{{TEST_CODE}}", testFile);

			/*
			const overwrite: boolean = await PromptCLI.confirm("Tests already exist for this operation. Would you like to overwrite ?");

			if (!overwrite) {
				return;
			}
			*/
		}

		// Construct the request message
		const response = await this.callOpenAi(openAiContext);

		// Report the response to the user
		this.clearConsole();
		this.printCode(response.content);

		// Enter the operation loop
		await this.operationLoop(response.content, operation, path.resolve(process.cwd() + "/test/"));
	}

	private static async operationLoop(content: string, filename?: string, filepath?: string): Promise<string> {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			// Check if the user wants to save the operation
			const nextOperation: string = await PromptCLI.select("Would you like to do next?", [
				{ title: "Save File", value: "save" },
				{ title: "Edit File", value: "edit" },
				{ title: "Try Again", value: "retry" },
				{ title: "Cancel", value: "cancel" },
			]);

			if (nextOperation === "save") {
				await this.promptFileSave(content, filename, filepath);
				return "saved";
			} else if (nextOperation === "edit") {
				const response: ChatCompletionResponseMessage | void = await this.promptFileEdit(content);
				if (!response) {
					continue;
				}

				content = response.content;

				// Report the response to the user
				this.clearConsole();
				this.printCode(content);
			} else if (nextOperation === "cancel") {
				return "cancel";
			}
		}
	}

	public static async getOperationsFilenames(): Promise<string[]> {
		// Get all of the files in the operations directory
		const dir = path.resolve(process.cwd() + "/src/operations");
		const files = fs.readdirSync(dir);

		// Return all operations, except for index.ts
		return files.filter((file) => file !== "index.ts");
	}

	private static printCode(code: string): void {
		console.log(highlight(code, { language: "typescript", ignoreIllegals: true }));
	}

	private static clearConsole(): void {
		//console.clear();
	}

	private static async promptFileEdit(content: string): Promise<ChatCompletionResponseMessage | void> {
		// Prompt the user for the edits they want to make
		const edits: string = await PromptCLI.text("What edits would you like to make? (Enter nothing to return to previous menu)");

		// If nothing is provided, exit
		if (edits === "") {
			return;
		}

		// Construct the request message
		return await this.callOpenAi(EDIT_OPERATION.replaceAll("{{EDITS}}", edits).replaceAll("{{CODE}}", content));
	}

	private static async promptFileSave(content: string, filename?: string, filepath?: string): Promise<void> {
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
		FileWrite.setWorkingDirectory(path.resolve(filepath || process.cwd() + "/src/operations"));
		FileWrite.run(path.resolve(filepath || process.cwd() + "/src/operations/", filename), content);

		// Log the filename
		console.log(`Saved file: ${filename}`);
	}

	private static async callOpenAi(userPrompt: string): Promise<ChatCompletionResponseMessage> {
		const openAI = new OpenAI();
		const requestMessage = new RequestMessage();

		// Construct the request message
		requestMessage.addUserPrompt(userPrompt);

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = requestMessage.generateMessages();

		// Get the response and handle it
		const response = await openAI.getCompletion(messages);

		// Store GPT's reponse
		requestMessage.addGPTResponse(response);

		return response;
	}
}
