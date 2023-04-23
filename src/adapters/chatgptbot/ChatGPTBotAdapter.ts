import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";

export default class ChatGPTBotAdapter {
	public static getName(): string {
		return "ChatGPT Bot";
	}

	public static getDescription(): string {
		return "A bot that emulates the behavior of Chat GPT with history of a conversation";
	}

	public static async run(): Promise<void> {
		const openAI = new OpenAI();
		const requestMessage = new RequestMessage();

		// eslint-disable-next-line no-constant-condition
		while (true) {
			// Get the user's prompt
			const prompt = await PromptCLI.text(`Prompt (type "q" to exit):`);
			if (PromptCLI.quitCommands.includes(prompt)) {
				process.exit();
			}

			// Construct the request message based on history
			requestMessage.addHistoryContext();
			requestMessage.addUserPrompt(prompt);

			// Submit the request to OpenAI, and cycle back to handle the response
			const messages = requestMessage.generateMessages();

			// Get the response and handle it
			const response = await openAI.getCompletion(messages);

			// Store GPT's reponse
			requestMessage.addGPTResponse(response);

			// Report the response to the user
			console.log(`\nGPT Response:\n${response.content}\n`);
		}
	}
}
