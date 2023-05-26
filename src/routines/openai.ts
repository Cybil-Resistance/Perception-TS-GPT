import { config as cfg } from "@src/config";
import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { ChatCompletionRequestMessage, ChatCompletionResponseMessage } from "openai";
import natural from "natural";
import State from "@src/classes/state/State";

export default class OpenAIRoutine {
	public static getName(): string {
		return "OpenAI chat completion";
	}

	public static getDescription(): string {
		return "Submit prompts to OpenAI's chat completion API";
	}

	public static async promptWithHistory(state: State, callback: (s: ChatCompletionResponseMessage) => void): Promise<void> {
		// Get the user's prompt
		const prompt = await PromptCLI.text(`Prompt (type "q" to exit):`);
		if (PromptCLI.quitCommands.includes(prompt)) {
			process.exit();
		}

		// Get the request message from the state
		const requestMessage = state.getRequestMessage();

		// Construct the request message based on history
		requestMessage.addHistoryContext();
		requestMessage.addUserPrompt(prompt);

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = requestMessage.generateMessages();

		const openAI = new OpenAI();
		openAI.getCompletion({
			messages,
			model: cfg.SMART_LLM_MODEL,
			onMessageCallback: (content: string) => {
				process.stdout.write(content);
			},
			onCompleteCallback: (content: ChatCompletionRequestMessage) => {
				requestMessage.addGPTResponse(content);
				callback(content);
			},
		});
	}

	public static async getSummarization(state: State, text: string, question: string): Promise<string> {
		const openAI = new OpenAI();

		// Get the request message from the state
		const requestMessage = state.getRequestMessage();

		const chunks = this.splitSentencesUsingNLP(text, 8192);
		const summaries = [];

		for (const index in chunks) {
			const chunk = chunks[index];

			const prompt = this.prepareSummaryPrompt(chunk, question);

			requestMessage.addUserPrompt(prompt);

			// Submit the request to OpenAI, and cycle back to handle the response
			const messages = requestMessage.generateMessages();

			console.log(`Submitting chunk ${parseInt(index, 10) + 1} of ${chunks.length} to OpenAI...`);
			const response = await openAI.getCompletion({
				messages,
				model: cfg.SMART_LLM_MODEL,
				onMessageCallback: (response) => {
					process.stdout.write(response);
				},
			});

			requestMessage.addGPTResponse(response);

			summaries.push(response.content);
		}

		// If there was only one chunk, just return that
		if (summaries.length === 1) {
			return summaries[0];
		}

		// Ask once more for a summary of the summaries
		const prompt = this.prepareSummaryPrompt(summaries.join("\n"), question);

		requestMessage.addUserPrompt(prompt);

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = requestMessage.generateMessages();

		console.log(`Summarizing all chunk summaries with OpenAI...`);
		const response = await openAI.getCompletion({
			messages,
			model: cfg.SMART_LLM_MODEL,
			onMessageCallback: (response) => {
				process.stdout.write(response);
			},
		});

		requestMessage.addGPTResponse(response);

		return response.content;
	}

	private static prepareSummaryPrompt(text: string, question: string): string {
		return `"""${text}""" Using the above text, answer the following question: "${question}" -- if the question cannot be answered using the text, summarize the text and include as much relevant information as possible.`;
	}

	private static splitSentencesUsingNLP(text: string, chunkSize: number): string[] {
		const tokenizer = new natural.SentenceTokenizer();
		const sentences = tokenizer.tokenize(text);

		const chunks = [];
		let currentChunk = "";
		while (currentChunk.length < chunkSize) {
			if (sentences.length === 0) {
				break;
			}

			currentChunk += sentences.shift() + " ";

			if (sentences.length === 0) {
				break;
			}

			if (currentChunk.length + sentences[0].length > chunkSize) {
				chunks.push(currentChunk);
				currentChunk = "";
			}
		}

		// Get the last bit of text
		if (currentChunk.length > 0) {
			chunks.push(currentChunk);
			currentChunk = "";
		}

		return chunks;
	}
}
