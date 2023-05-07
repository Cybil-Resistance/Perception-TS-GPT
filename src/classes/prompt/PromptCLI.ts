import prompts from "prompts";

export class PromptCLI {
	public static quitCommands = ["n", "no", "exit", "quit", "q"];

	public static async text(message: string): Promise<string> {
		const { prompt } = await prompts({
			type: "text",
			name: "prompt",
			message
		}, {
			onCancel: this.exitOnCancel,
		});

		return prompt;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static async select(message: string, choices: prompts.Choice[]): Promise<any> {
		const { prompt } = await prompts({
			type: "select",
			name: "prompt",
			message,
			choices,
		}, {
			onCancel: this.exitOnCancel,
		});

		return prompt;
	}

	public static async confirm(message: string): Promise<boolean> {
		const { prompt } = await prompts({
			type: "confirm",
			name: "prompt",
			message,
		}, {
			onCancel: this.exitOnCancel,
		});

		return prompt;
	}

	private static exitOnCancel(): void {
		console.log('-- Exiting Perception --');
		process.exit();
	}
}
