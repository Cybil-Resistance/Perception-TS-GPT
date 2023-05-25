import prompts from "prompts";
import readline from "readline";

export class PromptCLI {
	public static quitCommands = ["n", "no", "exit", "quit", "q"];

	public static async text(message: string): Promise<string> {
		const { prompt } = await prompts(
			{
				type: "text",
				name: "prompt",
				message,
			},
			{
				onCancel: this.exitOnCancel,
			},
		);

		return prompt;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public static async select(message: string, choices: prompts.Choice[]): Promise<any> {
		const { prompt } = await prompts(
			{
				type: "select",
				name: "prompt",
				message,
				choices,
			},
			{
				onCancel: this.exitOnCancel,
			},
		);

		return prompt;
	}

	public static async confirm(message: string): Promise<boolean> {
		const { prompt } = await prompts(
			{
				type: "confirm",
				name: "prompt",
				message,
			},
			{
				onCancel: this.exitOnCancel,
			},
		);

		return prompt;
	}

	public static async multiline(message: string): Promise<string> {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		console.log(message);

		const lines: string[] = [];
		for await (const line of rl) {
			if (line === "") {
				break;
			}
			lines.push(line);
		}
		rl.close();

		return lines.join("\n");
	}

	private static exitOnCancel(): void {
		console.log("-- Exiting Perception --");
		process.exit();
	}
}
