import { OpenAI } from "@src/classes/llm";
import prompts from 'prompts';

const quitCommands = ["n", "N", "no", "No", "NO", "exit", "Exit", "EXIT", "quit", "Quit", "QUIT", "q", "Q"];

(async (): Promise<void> => {
	const openAI = new OpenAI();

	while (true) {
		const { prompt } = await prompts({
			type: "text",
			name: "prompt",
			message: "Prompt (use \"n\" to exit):",
		});

		if (quitCommands.includes(prompt)) {
			process.exit();
		}

		const response = await openAI.getSimplePromptCompletion(prompt);
		console.log(response);
	}
})();
