import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";

(async (): Promise<void> => {
	const openAI = new OpenAI();
	const requestMessage = new RequestMessage();

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

		const response = await openAI.getCompletion(messages);

		// Store GPT's reponse
		requestMessage.addGPTResponse(response);

		// Report the response to the user
		console.log(`\nGPT Response: ${response.content}\n`);
	}
})();
