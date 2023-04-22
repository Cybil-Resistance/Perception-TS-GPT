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
}
