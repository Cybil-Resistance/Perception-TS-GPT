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

	public static async run() {
		const openAI = new OpenAI();
		const requestMessage = new RequestMessage();

		// Get the user's prompt
		const prompt = await PromptCLI.text(`What objective would you like your AutoBot to perform for you?:`);
		if (PromptCLI.quitCommands.includes(prompt)) {
			process.exit();
		}

		// Set up the system prompt
		requestMessage.setSystemPrompt(SYSTEM_PROMPT.replace("{{OBJECTIVE}}", prompt));
		requestMessage.includeSystemTime(true);

		// eslint-disable-next-line no-constant-condition
		while (true) {
			let prompt = "Determine which next command to use, and respond using the format specified above:";

			// Construct the request message based on history
			requestMessage.addUserPrompt(prompt);

			// Submit the request to OpenAI, and cycle back to handle the response
			const messages = requestMessage.generateMessagesWithHistory();

			// Get the response and handle it
			const response = await openAI.getCompletion(messages);

			// Store GPT's reponse
			requestMessage.addGPTResponse(response);

			// Report the response to the user
			console.log(`\nGPT Response: ${response.content}\n`);
		}
	}
}
