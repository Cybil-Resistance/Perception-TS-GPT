import { OpenAI } from "@src/classes/llm";
import { PromptCLI } from "@src/classes/prompt";
import { RequestMessage } from "@src/classes/request";
import { Operations } from "@src/operations";
import OpenAiRoutine from "@src/routines/openai";
const dJSON = require('dirty-json');

// Local imports
import { SYSTEM_PROMPT } from "./config/prompts";

export default class AutoBotAdapter {
	public static getName(): string {
		return "AutoBot";
	}

	public static getDescription(): string {
		return "A bot that automatically responds to user input";
	}

	public static async run(): Promise<void> {
		const openAI = new OpenAI();
		const requestMessage = new RequestMessage();

		// Get the user's prompt
		const prompt = await PromptCLI.text(`What objective would you like your AutoBot to perform for you?:`);
		if (PromptCLI.quitCommands.includes(prompt)) {
			process.exit();
		}

		// Collect all of the commands from the operations folder
		const commands = Operations.map((operation) => {
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

		// Report the state of the program to the user
		console.log(`\nCommands enabled:\n${commands.join("\n")}`);
		console.log(`\nObjective: ${prompt}\n`);

		// Allow the user to auto-approve prompts
		let promptsToRunRemaining = 0;

		// eslint-disable-next-line no-constant-condition
		while (true) {
			// Set up the system prompts
			requestMessage.addSystemPrompt(
				SYSTEM_PROMPT.replaceAll("{{OBJECTIVE}}", prompt).replaceAll("{{COMMANDS}}", commands.join("\n")),
			);
			requestMessage.addSystemPrompt(`The current time is ${new Date().toLocaleString()}.`);
			requestMessage.addHistoryContext();

			// Construct the request message based on history
			requestMessage.addUserPrompt(
				"Determine which next command to use, and respond ONLY using the JSON format specified. No other response format is permitted.",
			);

			// Submit the request to OpenAI, and cycle back to handle the response
			const messages = requestMessage.generateMessages();

			// Get the response and handle it
			const response = await openAI.getCompletion(messages);

			// Store GPT's reponse
			requestMessage.addGPTResponse(response);

			// Report the response to the user
			console.log(`\nGPT Response:\n${response.content}\n`);

			// Parse the JSON response
			try {
				const parsedResponse = dJSON.parse(response.content.replaceAll("\n", " "));

				// Figure out which command it wants to run
				const parsedCommandName = parsedResponse.command.name;
				const parsedCommandArgs = parsedResponse.command.args;

				// Prompt the user if they'd like to continue
				if (promptsToRunRemaining <= 0) {
					const selection = await PromptCLI.select(
						`Would you like to run the command "${parsedCommandName}" with the arguments "${JSON.stringify(
							parsedCommandArgs,
						)}"?`,
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
						],
					);

					promptsToRunRemaining = selection;
				} else {
					console.log(
						`Auto-approving the command "${parsedCommandName}" with the arguments "${JSON.stringify(parsedCommandArgs)}".`,
					);
					console.log(`Auto-approvals remaining: ${promptsToRunRemaining}`);
				}

				if (promptsToRunRemaining <= 0) {
					requestMessage.addSystemPrompt(`User rejected your suggested command. Re-evaluate your options and try again.`);
					continue;
				}

				// Decrement the prompts to run
				promptsToRunRemaining--;

				// Attempt to run the command
				for (const operation of Operations) {
					for (const cmd of operation.getOperations()) {
						if (cmd.method === parsedCommandName) {
							// Compile the arguments
							const orderedArgs = [];
							for (const index in cmd.args) {
								const arg = cmd.args[index];
								const value = parsedCommandArgs[arg.key];
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
							let output = await cmd.call(...orderedArgs);

							// If there is no output, continue
							if (!output) {
								requestMessage.addSystemPrompt(`The command "${parsedCommandName}" returned successfully.`);
								continue;
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
								const summary = await OpenAiRoutine.getSummarization("autobot", output, prompt);
								console.log(`Summary:\n${summary}\n`);
								requestMessage.addSystemPrompt(`The result of your command was: "${summary}".`);
							} else {
								console.log(`\nOutput:\n${output}\n`);
								requestMessage.addSystemPrompt(`The result of your command was: "${output}".`);
							}
						}
					}
				}
			} catch (error) {
				console.error(error);

				requestMessage.addSystemPrompt(`Your response must follow the JSON format.`);
			}
		}
	}
}
