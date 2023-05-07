import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";
import { Operations } from "@src/operations";
import OpenAiRoutine from "@src/routines/openai";
import { BaseBotAdapter } from "@src/adapters/BaseBotAdapter";
import { config as cfg } from "@src/config";
import dJSON from "dirty-json";

// Local imports
import { PERCEPTION_SYSTEM_PROMPT, CLASSIC_SYSTEM_PROMPT } from "./config/prompts";

export default class AutoBotAdapter extends BaseBotAdapter {
	private static openAI: OpenAI;
	private static requestMessage: RequestMessage;
	private static commands: string[];
	private static objective: string;
	private static promptsToRunRemaining: number = 0;

	public static getName(): string {
		return "AutoBot";
	}

	public static getDescription(): string {
		return "Give GPT an automated task";
	}

	public static async run(): Promise<void> {
		// Initalize OpenAI helper and the request message
		this.openAI = new OpenAI();
		this.requestMessage = new RequestMessage();

		// Collect all of the commands from the operations folder
		this.commands = this.getOperations();

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

	private static getOperations(): string[] {
		return Operations.map((operation) => {
			const operations = [];
			for (const cmd of operation.getOperations()) {
				if (cmd.disabled) {
					continue;
				}

				operations.push(
					`- ${operation.getName()}: "${cmd.method}", args: ${cmd.args.map((arg) => `"${arg.key}": "<${arg.type}>"`).join(", ")}`,
				);
			}

			if (!operations.length) {
				return "";
			}

			return operations.join("\n");
		}).filter((command) => command.length);
	}

	private static async startPerception(): Promise<void> {
		// Get the user's prompt
		this.objective = await PromptCLI.text(`What objective would you like your AutoBot to perform for you?:`);
		if (PromptCLI.quitCommands.includes(this.objective)) {
			process.exit();
		}

		// Report the state of the program to the user
		console.log(`\nCommands enabled:\n${this.commands.join("\n")}`);
		console.log(`\nObjective: ${this.objective}\n`);

		this.runPerception();
	}

	private static async runPerception(): Promise<void> {
		// Set up the system prompts
		this.requestMessage.addSystemPrompt(
			PERCEPTION_SYSTEM_PROMPT.replaceAll("{{OBJECTIVE}}", this.objective).replaceAll("{{COMMANDS}}", this.commands.join("\n")),
		);
		this.requestMessage.addSystemPrompt(`The current time is ${new Date().toLocaleString()}.`);
		this.requestMessage.addHistoryContext();

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

			this.requestMessage.addSystemPrompt(`Your response must follow the JSON format.`);

			return this.runPerception();
		}

		// Prompt the user if they'd like to continue
		if (!(await this.promptOperation(parsedCommandName, parsedCommandArgs))) {
			return this.runPerception();
		}

		// Attempt to run the command
		return this.issueOperation(parsedCommandName, parsedCommandArgs, this.runPerception.bind(this));
	}

	private static async startClassic(): Promise<void> {
		// Get the user's prompt
		this.objective = await PromptCLI.text(`What objective would you like your AutoBot to perform for you?:`);
		if (PromptCLI.quitCommands.includes(this.objective)) {
			process.exit();
		}

		// Report the state of the program to the user
		console.log(`\nCommands enabled:\n${this.commands.join("\n")}`);
		console.log(`\nObjective: ${this.objective}\n`);

		this.runClassic();
	}

	private static async runClassic(): Promise<void> {
		// Set up the system prompts
		this.requestMessage.addSystemPrompt(
			CLASSIC_SYSTEM_PROMPT.replaceAll("{{OBJECTIVE}}", this.objective).replaceAll("{{COMMANDS}}", this.commands.join("\n")),
		);
		this.requestMessage.addSystemPrompt(`The current time is ${new Date().toLocaleString()}.`);
		this.requestMessage.addHistoryContext();

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
			parsedCommandName = parsedResponse.command.name;
			parsedCommandArgs = parsedResponse.command.args;
		} catch (error) {
			console.error(error);

			this.requestMessage.addSystemPrompt(`Your response must follow the JSON format.`);

			return this.runClassic();
		}

		// Prompt the user if they'd like to continue
		if (!(await this.promptOperation(parsedCommandName, parsedCommandArgs))) {
			return this.runClassic();
		}

		// Attempt to run the command
		return this.issueOperation(parsedCommandName, parsedCommandArgs, this.runClassic.bind(this));
	}

	private static async promptOperation(_commandName: string, _commandArgs: string[]): Promise<boolean> {
		// Prompt the user if they'd like to continue
		if (this.promptsToRunRemaining <= 0) {
			const selection = await PromptCLI.select(
				`Would you like to run the command "${_commandName}" with the arguments "${JSON.stringify(_commandArgs)}"?`,
				[
					{
						title: "Yes",
						value: 1,
					},
					{
						title: "No",
						value: 0,
					},
					{
						title: "Yes, and auto-approve the next 3 prompts",
						value: 3,
					},
					{
						title: "Exit",
						value: -1,
					},
				],
			);

			this.promptsToRunRemaining = selection;
		} else {
			console.log(`Auto-approving the command "${_commandName}" with the arguments "${JSON.stringify(_commandArgs)}".`);
			console.log(`Auto-approvals remaining: ${this.promptsToRunRemaining}`);
		}

		if (this.promptsToRunRemaining == 0) {
			this.requestMessage.addSystemPrompt(`User rejected your suggested command. Re-evaluate your options and try again.`);
			return false;
		} else if (this.promptsToRunRemaining < 0) {
			process.exit();
		}

		// Decrement the prompts to run
		this.promptsToRunRemaining--;

		return true;
	}

	private static async issueOperation(_commandName: string, _commandArgs: any[], callback: () => Promise<void>): Promise<void> {
		for (const operation of Operations) {
			for (const cmd of operation.getOperations()) {
				if (cmd.method === _commandName) {
					// Compile the arguments
					const orderedArgs = [];
					for (const index in cmd.args) {
						const arg = cmd.args[index];
						const value = _commandArgs[arg.key];
						if (value === undefined) {
							if (arg.optional) {
								orderedArgs[index] = undefined;
							} else {
								throw new Error(`Missing required argument "${arg.key}"`);
							}
						} else {
							orderedArgs[index] = value;
						}
					}

					// Run the command
					let output;
					try {
						output = await cmd.call(...orderedArgs);
					} catch (error) {
						let errMsg = `The command "${_commandName}" failed to run with the error: "${error.message}"`;
						console.error(errMsg);
						this.requestMessage.addSystemPrompt(errMsg);
						return callback();
					}

					// If there is no output, continue
					if (!output) {
						this.requestMessage.addSystemPrompt(`The command "${_commandName}" returned successfully.`);
						return callback();
					}

					// Prep the output
					if (Array.isArray(output)) {
						// If the output is an array, join it by newlines
						output = output.join("\n");
					} else if (typeof output === "object") {
						// If the output is an object, stringify it
						output = JSON.stringify(output);
					}

					// If the content is too long, iterate through summarization
					if (output.length > 2048) {
						console.log(`Output was too long, summarizing...`);
						const summary = await OpenAiRoutine.getSummarization("autobot", output, this.objective);
						console.log(`Summary:\n${summary}\n`);
						this.requestMessage.addSystemPrompt(`The result of your command was: "${summary}".`);
					} else {
						console.log(`\nOutput:\n${output}\n`);
						this.requestMessage.addSystemPrompt(`The result of your command was: "${output}".`);
					}
				}
			}
		}

		callback();
	}
}
