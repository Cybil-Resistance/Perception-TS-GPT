import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { WebOperations } from "@src/operations";
import { BaseBotAdapter } from "@src/adapters/BaseBotAdapter";
import { config as cfg } from "@src/config";
import AutobotRoutine from "@src/routines/autobot";
import dJSON from "dirty-json";

// Local imports
import { SYSTEM_PROMPT } from "./config/prompts";

export default class ResearchBotAdapter extends BaseBotAdapter {
	public static getName(): string {
		return "ResearchBot";
	}

	public static getDescription(): string {
		return "Ask GPT to research a topic for you.";
	}

	public static async run(): Promise<void> {
		// Collect all of the commands from the operations folder
		const commands = AutobotRoutine.listOperations(WebOperations);

		// Get the user's prompt
		const objective = await PromptCLI.text(`What would you like to research?`);
		if (PromptCLI.quitCommands.includes(objective)) {
			process.exit();
		}

		// Report the state of the program to the user
		console.log(`\nCommands enabled:\n${commands.join("\n")}`);
		console.log(`\nResearch topic: ${objective}\n`);

		// Save the objective to the program state
		this.state.setProgramState("researcher", { objective });

		this.runResearcher();
	}

	private static async runResearcher(operationResult?: string): Promise<void> {
		// Get the state requestMessage and data
		const requestMessage = this.state.getRequestMessage();
		const { objective } = this.state.getProgramState("researcher");

		// Collect all of the commands from the operations folder
		const commands = AutobotRoutine.listOperations(WebOperations);

		// Set up the system prompts
		requestMessage.addSystemPrompt(
			SYSTEM_PROMPT.replaceAll("{{OBJECTIVE}}", objective).replaceAll("{{COMMANDS}}", commands.join("\n")),
		);
		requestMessage.addSystemPrompt(`The current time is ${new Date().toLocaleString()}.`);
		requestMessage.addHistoryContext();

		if (operationResult) {
			requestMessage.addSystemPrompt(operationResult);
		}

		// Construct the request message based on history
		requestMessage.addUserPrompt(
			"Determine which next command to use, and respond ONLY using the JSON format specified. No other response format is permitted.",
		);

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = requestMessage.generateMessages();

		// Get the response and handle it
		const openAI = new OpenAI();
		const response = await openAI.getCompletion({
			messages,
			model: cfg.FAST_LLM_MODEL,
			onMessageCallback: (response) => {
				process.stdout.write(response);
			},
		});

		// Store GPT's reponse
		requestMessage.addGPTResponse(response);

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

			requestMessage.addSystemPrompt(`Your response must follow the JSON format.`);

			return this.runResearcher();
		}

		// Attempt to run the command
		return AutobotRoutine.issueOperation(
			this.state,
			parsedCommandName,
			parsedCommandArgs,
			WebOperations,
			this.runResearcher.bind(this),
		);
	}
}
