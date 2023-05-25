import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";
import { WebOperations } from "@src/operations";
import { BaseBotAdapter } from "@src/adapters/BaseBotAdapter";
import { config as cfg } from "@src/config";
import AutobotRoutine from "@src/routines/autobot";
import dJSON from "dirty-json";

// Local imports
import { SYSTEM_PROMPT } from "./config/prompts";

export default class ResearchBotAdapter extends BaseBotAdapter {
	private static openAI: OpenAI;
	private static requestMessage: RequestMessage;
	private static commands: string[];
	private static objective: string;

	public static getName(): string {
		return "ResearchBot";
	}

	public static getDescription(): string {
		return "Ask GPT to research a topic for you.";
	}

	public static async run(): Promise<void> {
		// Initalize OpenAI helper and the request message
		this.openAI = new OpenAI();
		this.requestMessage = new RequestMessage();

		// Collect all of the commands from the operations folder
		this.commands = AutobotRoutine.listOperations(WebOperations);

		// Get the user's prompt
		this.objective = await PromptCLI.text(`What would you like to research?`);
		if (PromptCLI.quitCommands.includes(this.objective)) {
			process.exit();
		}

		// Report the state of the program to the user
		console.log(`\nCommands enabled:\n${this.commands.join("\n")}`);
		console.log(`\nResearch topic: ${this.objective}\n`);

		this.runResearcher();
	}

	private static async runResearcher(operationResult?: string): Promise<void> {
		// Set up the system prompts
		this.requestMessage.addSystemPrompt(
			SYSTEM_PROMPT.replaceAll("{{OBJECTIVE}}", this.objective).replaceAll("{{COMMANDS}}", this.commands.join("\n")),
		);
		this.requestMessage.addSystemPrompt(`The current time is ${new Date().toLocaleString()}.`);
		this.requestMessage.addHistoryContext();

		if (operationResult) {
			this.requestMessage.addSystemPrompt(operationResult);
		}

		// Construct the request message based on history
		this.requestMessage.addUserPrompt(
			"Determine which next command to use, and respond ONLY using the JSON format specified. No other response format is permitted.",
		);

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = this.requestMessage.generateMessages();

		// Get the response and handle it
		const response = await this.openAI.getCompletion({
			messages,
			model: cfg.FAST_LLM_MODEL,
			onMessageCallback: (response) => {
				process.stdout.write(response);
			},
		});

		// Store GPT's reponse
		this.requestMessage.addGPTResponse(response);

		// Parse the JSON response
		let parsedCommandName, parsedCommandArgs;
		try {
			// Remove any pre or post-text around the JSON
			const jsonStartIndex = response.content.indexOf("{");
			const jsonEndIndex = response.content.lastIndexOf("}");
			response.content = response.content.substring(jsonStartIndex, jsonEndIndex + 1);

			// Parse and clean the JSON
			const parsedResponse = dJSON.parse(response.content.replaceAll("\n", " "));

			// Figure out which command it wants to run
			parsedCommandName = parsedResponse.command;
			parsedCommandArgs = parsedResponse.args;
		} catch (error) {
			console.error(error);

			this.requestMessage.addSystemPrompt(`Your response must follow the JSON format.`);

			return this.runResearcher();
		}

		// Attempt to run the command
		return AutobotRoutine.issueOperation(
			parsedCommandName,
			parsedCommandArgs,
			this.objective,
			WebOperations,
			this.runResearcher.bind(this),
		);
	}
}
