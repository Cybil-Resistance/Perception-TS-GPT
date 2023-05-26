import fs from "fs";
import OpenAIRoutine from "@src/routines/openai";
import Selenium from "@src/operations/selenium";
import { PromptCLI } from "@src/classes/prompt";
import { BaseBotAdapter } from "@src/adapters/BaseBotAdapter";

export default class SummaryBotAdapter extends BaseBotAdapter {
	public static getName(): string {
		return "Summary Bot";
	}

	public static getDescription(): string {
		return "Analyze and summarize text from file or URL";
	}

	public static async run(): Promise<void> {
		// Ask the user what file or URL they want to summarize
		const prompt: string = await PromptCLI.text("Enter the path to the file or URL:");

		// Check if the prompt is a URL
		let contents: string;
		if (prompt.startsWith("http")) {
			// Get the page contents
			contents = await Selenium.run(prompt);
		} else if (fs.existsSync(prompt)) {
			// Get the file contents
			contents = fs.readFileSync(prompt, "utf8");
		} else {
			// Invalid file or URL
			console.log("Invalid file or URL");
			return;
		}

		let askAgain: boolean = true;
		do {
			// Ask the user what question they have
			const question: string = await PromptCLI.text("Enter the question you have about this text:");

			// Summarize the file contents
			const summary: string = await OpenAIRoutine.getSummarization(this.state, contents, question);

			// Display the summary
			console.log(`\nGPT response:\n${summary}\n`);

			// Ask the user if they want to ask another question
			askAgain = await PromptCLI.confirm("Ask another question about this file?");
		} while (askAgain);

		// Ask the user if they want to summarize another file or URL
		const repeat: boolean = await PromptCLI.confirm("Summarize another file or URL?");

		if (repeat) {
			await this.run();
		}
	}
}
