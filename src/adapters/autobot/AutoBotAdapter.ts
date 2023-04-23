//import GPTAdapter from "@src/adapters/GPTAdapter";
import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";

// Local imports
import { CONSTRAINTS, COMMANDS, RESOURCES, PERFORMANCE_EVALUATION, RESPONSE_FORMAT } from "./config/prompts";

export default class AutoBotAdapter {
	//implements GPTAdapter {
	public static getName(): string {
		return "AutoBot";
	}

	public static getDescription(): string {
		return "A bot that automatically responds to user input";
	}

	public static async run() {
		const openAI = new OpenAI();
		const requestMessage = new RequestMessage();

		// Set up the system prompt
		requestMessage.setSystemPrompt(`${CONSTRAINTS}${COMMANDS}${RESOURCES}${PERFORMANCE_EVALUATION}${RESPONSE_FORMAT}`);

		// eslint-disable-next-line no-constant-condition
		while (true) {
			// Get the user's prompt
			const prompt = await PromptCLI.text(`Prompt (use "n" to exit):`);

			if (PromptCLI.quitCommands.includes(prompt)) {
				process.exit();
			}

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
