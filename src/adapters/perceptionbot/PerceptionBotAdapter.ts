import { ChatCompletionResponseMessage } from "openai";
import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";
import FileWrite from "@src/operations/file_write";
import { CREATE_OPERATION, EDIT_OPERATION } from "./config/prompts";
import path from "path";

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
				{ title: "Create a mocha test for an existing operation", value: "test" },
			]);

			switch (prompt) {
				case "create":
					await this.createOperation();
					break;
				case "edit":
					//await this.editOperation();
					break;
				case "test":
					//await this.createTestOperation();
					break;
				default:
					break;
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
			let response = await this.callOpenAi(
				CREATE_OPERATION.replaceAll("{{CLASS_NAME}}", nameOfClass).replaceAll("{{OPERATION}}", funcOfOperation),
			);

			do {
				// Report the response to the user
				console.log(`\nGPT Response:\n${response.content}\n`);

				// Check if the user wants to save the operation
				const nextOperation: string = await PromptCLI.select("Would you like to do next?", [
					{ title: "Save File", value: "save" },
					{ title: "Edit File", value: "edit" },
					{ title: "Try Again", value: "retry" },
					{ title: "Cancel", value: "cancel" },
				]);

				if (nextOperation === "save") {
					// Prompt the user for the filename
					let filename: string = await PromptCLI.text("What would you like to name the file? (include the extension)");

					// For this filename, strip any slashes
					filename = filename.replaceAll("/", "");

					// Save the operation
					FileWrite.setWorkingDirectory(path.resolve(process.cwd() + "/src/operations"));
					FileWrite.run(path.resolve(process.cwd() + "/src/operations/" + filename), response.content);

					// Exit
					runOperation = false;
					break;
				} else if (nextOperation === "edit") {
					// Prompt the user for the edits they want to make
					const edits: string = await PromptCLI.text("What edits would you like to make?");

					// Construct the request message
					response = await this.callOpenAi(
						EDIT_OPERATION.replaceAll("{{EDITS}}", edits).replaceAll("{{CODE}}", response.content),
					);
				} else if (nextOperation === "retry") {
					runOperation = true;
					break;
				} else if (nextOperation === "cancel") {
					runOperation = false;
					break;
				}
				// eslint-disable-next-line no-constant-condition
			} while (true);
		}
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

	//private static async createTestOperation(): Promise<void> {}
}
