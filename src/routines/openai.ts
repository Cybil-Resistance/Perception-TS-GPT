import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";
import { ChatCompletionRequestMessage, ChatCompletionResponseMessage } from "openai";

export default class OpenAIRoutine {
	// Keep track of request messages per key
	private static requestMessageTable: { [key: string]: RequestMessage } = {};

	public static getName(): string {
		return "OpenAI chat completion";
	}

	public static getDescription(): string {
		return "Submit prompts to OpenAI's chat completion API";
	}

	public static async getChatCompletion(
		callback: (s: ChatCompletionResponseMessage) => void,
		messages: ChatCompletionRequestMessage[],
	): Promise<void> {
		const openAI = new OpenAI();
		openAI.getCompletionStreaming(callback, messages);
	}

	public static async promptWithHistory(key: string, callback: (s: ChatCompletionResponseMessage) => void): Promise<void> {
		// Get the user's prompt
		const prompt = await PromptCLI.text(`Prompt (type "q" to exit):`);
		if (PromptCLI.quitCommands.includes(prompt)) {
			process.exit();
		}

		// Initialize the request message table
		if (!(key in this.requestMessageTable)) {
			this.requestMessageTable[key] = new RequestMessage();
		}

		// Construct the request message based on history
		this.requestMessageTable[key].addHistoryContext();
		this.requestMessageTable[key].addUserPrompt(prompt);

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = this.requestMessageTable[key].generateMessages();

		this.getChatCompletion((content: ChatCompletionRequestMessage) => {
			this.requestMessageTable[key].addGPTResponse(content);
			callback(content);
		}, messages);
	}
}
