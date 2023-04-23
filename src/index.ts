import { PromptCLI } from "@src/classes/prompt";
import AutoBotAdapter from "@src/adapters/autobot/AutoBotAdapter";

// Run the program
(async (): Promise<void> => {
	// Get the user's prompt
	const ChosenAdapter = await PromptCLI.select(`Welcome to Perception GPT.\nPlease choose from the following programs to run.`, [
		{ title: AutoBotAdapter.getName(), description: AutoBotAdapter.getDescription(), value: AutoBotAdapter },
		{ title: "Exit", description: "Leave the program", value: false },
	]);

	if (!ChosenAdapter) {
		process.exit();
	}

	// Run the program
	await ChosenAdapter.run();
})();
