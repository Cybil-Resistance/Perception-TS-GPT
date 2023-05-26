import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { Operations } from "@src/operations";
import { BaseBotAdapter } from "@src/adapters/BaseBotAdapter";
import { config as cfg } from "@src/config";
import dJSON from "dirty-json";
import AutobotRoutine from "@src/routines/autobot";

// Local imports
import { PERCEPTION_SYSTEM_PROMPT, CLASSIC_SYSTEM_PROMPT } from "./config/prompts";
import State from "@src/classes/state/State";

export default class AutoBotAdapter extends BaseBotAdapter {
	private static state: State;

	public static getName(): string {
		return "AutoBot";
	}

	public static getDescription(): string {
		return "Give GPT an automated task";
	}

	public static async run(): Promise<void> {
		// Initialize the State
		this.state = new State();

		// Get the user's version preference
		const version = await PromptCLI.select(`Which version of AutoBot would you like to run?:`, [
			{
				title: "Perception",
				value: "perception",
			},
			{
				title: "Classic",
				value: "classic",
			},
			{
				title: "↩ Exit",
				value: "back",
			},
		]);

		if (version == "back") {
			process.exit();
		} else if (version == "perception") {
			return this.startPerception();
		} else {
			return this.startClassic();
		}
	}

	private static async startPerception(): Promise<void> {
		// Get the user's prompt
		const objective = await PromptCLI.text(`What objective would you like your AutoBot to perform for you?:`);
		if (PromptCLI.quitCommands.includes(objective)) {
			process.exit();
		}

		// Collect all of the commands from the operations folder
		const commands = AutobotRoutine.listOperations(Operations);

		// Report the state of the program to the user
		console.log(`\nCommands enabled:\n${commands.join("\n")}`);
		console.log(`\nObjective: ${objective}\n`);

		// Store the objective in the program state
		this.state.setProgramState("autobot", { objective });

		this.runPerception();
	}

	private static async runPerception(operationResult?: string): Promise<void> {
		// Get the requestMessage and the program state data
		const { objective } = this.state.getProgramState("autobot");
		const requestMessage = this.state.getRequestMessage();

		// Collect all of the commands from the operations folder
		const commands = AutobotRoutine.listOperations(Operations);

		// Set up the system prompts
		requestMessage.addSystemPrompt(
			PERCEPTION_SYSTEM_PROMPT.replaceAll("{{OBJECTIVE}}", objective).replaceAll("{{COMMANDS}}", commands.join("\n")),
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

		// Report the response to the user
		console.log(`\nGPT Response:\n${response.content}\n`);

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

			return this.runPerception();
		}

		// Prompt the user if they'd like to continue
		const _continue = await AutobotRoutine.promptOperation(this.state, parsedCommandName, parsedCommandArgs);

		if (!_continue) {
			return this.runPerception();
		}

		// Attempt to run the command
		return AutobotRoutine.issueOperation(this.state, parsedCommandName, parsedCommandArgs, Operations, this.runPerception.bind(this));
	}

	private static async startClassic(): Promise<void> {
		// Get the user's prompt
		const objective = await PromptCLI.text(`What objective would you like your AutoBot to perform for you?:`);
		if (PromptCLI.quitCommands.includes(objective)) {
			process.exit();
		}

		// Collect all of the commands from the operations folder
		const commands = AutobotRoutine.listOperations(Operations);

		// Report the state of the program to the user
		console.log(`\nCommands enabled:\n${commands.join("\n")}`);
		console.log(`\nObjective: ${objective}\n`);

		// Store the objective in the program state
		this.state.setProgramState("autobot", { objective });

		this.runClassic();
	}

	private static async runClassic(operationResult?: string): Promise<void> {
		// Get the requestMessage and the program state data
		const { objective } = this.state.getProgramState("autobot");
		const requestMessage = this.state.getRequestMessage();

		// Collect all of the commands from the operations folder
		const commands = AutobotRoutine.listOperations(Operations);

		// Set up the system prompts
		requestMessage.addSystemPrompt(
			CLASSIC_SYSTEM_PROMPT.replaceAll("{{OBJECTIVE}}", objective).replaceAll("{{COMMANDS}}", commands.join("\n")),
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
			parsedCommandName = parsedResponse.command.name;
			parsedCommandArgs = parsedResponse.command.args;
		} catch (error) {
			console.error(error);

			requestMessage.addSystemPrompt(`Your response must follow the JSON format.`);

			return this.runClassic();
		}

		// Prompt the user if they'd like to continue
		const _continue = await AutobotRoutine.promptOperation(this.state, parsedCommandName, parsedCommandArgs);

		if (!_continue) {
			return this.runClassic();
		}

		// Attempt to run the command
		return AutobotRoutine.issueOperation(this.state, parsedCommandName, parsedCommandArgs, Operations, this.runClassic.bind(this));
	}
}
