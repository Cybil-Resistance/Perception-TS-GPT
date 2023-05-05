import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";
import { ChatCompletionRequestMessage, ChatCompletionResponseMessage } from "openai";
import natural from "natural";

export default class OpenAIRoutine {
	// Keep track of request messages per key
	private static requestMessageTable: { [key: string]: RequestMessage } = {};

	public static getName(): string {
		return "OpenAI chat completion";
	}

	public static getDescription(): string {
		return "Submit prompts to OpenAI's chat completion API";
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

		const openAI = new OpenAI();
		openAI.getCompletion({
			messages,
			onMessageCallback: (content: string) => {
				process.stdout.write(content);
			},
			onCompleteCallback: (content: ChatCompletionRequestMessage) => {
				this.requestMessageTable[key].addGPTResponse(content);
				callback(content);
			},
		});
	}

	public static async getSummarization(key: string, text: string, question: string): Promise<string> {
		const openAI = new OpenAI();

		// Initialize the request message table
		if (!(key in this.requestMessageTable)) {
			this.requestMessageTable[key] = new RequestMessage();
		}

		const chunks = this.splitSentencesUsingNLP(text, 8192);
		const summaries = [];

		for (const index in chunks) {
			const chunk = chunks[index];

			const prompt = this.prepareSummaryPrompt(chunk, question);

			this.requestMessageTable[key].addUserPrompt(prompt);

			// Submit the request to OpenAI, and cycle back to handle the response
			const messages = this.requestMessageTable[key].generateMessages();

			console.log(`Submitting chunk ${parseInt(index, 10) + 1} of ${chunks.length} to OpenAI...`);
			const response = await openAI.getCompletion({ messages });

			this.requestMessageTable[key].addGPTResponse(response);

			summaries.push(response.content);
		}

		// Ask once more for a summary of the summaries
		const prompt = this.prepareSummaryPrompt(summaries.join("\n"), question);

		this.requestMessageTable[key].addUserPrompt(prompt);

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = this.requestMessageTable[key].generateMessages();

		console.log(`Summarizing all chunk summaries with OpenAI...`);
		const response = await openAI.getCompletion({ messages });

		this.requestMessageTable[key].addGPTResponse(response);

		return response.content;
	}

	private static prepareSummaryPrompt(text: string, question: string): string {
		return `"""${text}""" Using the above text, answer the following question: "${question}" -- if the question cannot be answered using the text, summarize the text.`;
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
