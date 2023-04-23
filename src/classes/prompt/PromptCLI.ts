import prompts from "prompts";

export class PromptCLI {
	public static quitCommands = ["n", "no", "exit", "quit", "q"];

	public static async text(message: string): Promise<string> {
		const { prompt } = await prompts({
			type: "text",
			name: "prompt",
			message,
		});

		return prompt;
	}

	public static async select(message: string, choices: prompts.Choice[]): Promise<any> {
		const { prompt } = await prompts({
			type: "select",
			name: "prompt",
			message,
			choices,
		});

		return prompt;
	}
}
