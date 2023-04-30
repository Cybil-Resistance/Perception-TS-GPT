//import prompts from "prompts";
import { PromptCLI } from "@src/classes/prompt";
import { Adapters } from "@src/adapters";

// Run the program
(async (): Promise<void> => {
	// Compile all adapters into a list of choices
	const AdapterChoices = Adapters.map((Adapter) => {
		return {
			title: Adapter.getName(),
			description: Adapter.getDescription(),
			value: Adapter,
		};
	});

	// Get the user's prompt
	console.clear();
	const ChosenAdapter = await PromptCLI.select(`\nWelcome to Perception GPT.\nPlease choose from the following programs to run.`, [
		...AdapterChoices,
		{ title: "Exit", description: "Leave the program", value: false },
	]);

	if (!ChosenAdapter) {
		process.exit();
	}

	// Run the program
	await ChosenAdapter.run();
})();
