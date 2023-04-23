import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";

// Local imports
import { SYSTEM_PROMPT } from "./config/prompts";

export default class AutoBotAdapter {
	public static getName(): string {
		return "AutoBot";
	}

	public static getDescription(): string {
		return "A bot that automatically responds to user input";
	}

	public static async run(): Promise<void> {
		const openAI = new OpenAI();
		const requestMessage = new RequestMessage();

		// Get the user's prompt
		const prompt = await PromptCLI.text(`What objective would you like your AutoBot to perform for you?:`);
		if (PromptCLI.quitCommands.includes(prompt)) {
			process.exit();
		}

		// eslint-disable-next-line no-constant-condition
		while (true) {
			// Set up the system prompts
			requestMessage.addSystemPrompt(SYSTEM_PROMPT.replaceAll("{{OBJECTIVE}}", prompt));
			requestMessage.addSystemPrompt(`The current time is ${new Date().toLocaleString()}.`);
			requestMessage.addHistoryContext();

			// Construct the request message based on history
			requestMessage.addUserPrompt(
				"Determine which next command to use, and respond ONLY using the JSON format specified. No other response format is permitted.",
			);

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
