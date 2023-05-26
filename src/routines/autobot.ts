import BaseOperation from "../operations/base_operation";
import OpenAiRoutine from "./openai";
import { PromptCLI } from "@src/classes/prompt";
import State from "@src/classes/state/State";

export default class AutobotRoutine {
	public static getName(): string {
		return "Autobot supportive routines";
	}

	public static getDescription(): string {
		return "Allow AI to make decisions for what operations to run";
	}

	public static listOperations(_Operations: Array<typeof BaseOperation>): string[] {
		return _Operations
			.map((operation) => {
				const operations = [];
				for (const cmd of operation.getOperations()) {
					if (cmd.disabled) {
						continue;
					}

					operations.push(
						`- ${operation.getName()}: "${cmd.method}", args: ${cmd.args
							.map((arg) => `"${arg.key}": "<${arg.type}>"`)
							.join(", ")}`,
					);
				}

				if (!operations.length) {
					return "";
				}

				return operations.join("\n");
			})
			.filter((command) => command.length);
	}

	public static async promptOperation(state: State, _commandName: string, _commandArgs: string[]): Promise<boolean> {
		// Get the prompts to run remaining from the state
		let { promptsToRunRemaining = 0 } = state.getProgramState("autobot");

		// Prompt the user if they'd like to continue
		if (promptsToRunRemaining <= 0) {
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

			promptsToRunRemaining = selection;
		} else {
			console.log(`Auto-approving the command "${_commandName}" with the arguments "${JSON.stringify(_commandArgs)}".`);
			console.log(`Auto-approvals remaining: ${promptsToRunRemaining}`);
		}

		if (promptsToRunRemaining == 0) {
			// Get the request message from the state, add the system prompt
			const requestMessage = state.getRequestMessage();
			requestMessage.addSystemPrompt(`User rejected your suggested command. Re-evaluate your options and try again.`);
			return false;
		} else if (promptsToRunRemaining < 0) {
			process.exit();
		}

		// Decrement the prompts to run
		promptsToRunRemaining--;

		// Store the latest prompts to run remaining
		state.setProgramState("autobot", { promptsToRunRemaining });

		return true;
	}

	public static async issueOperation(
		state: State,
		_commandName: string,
		_commandArgs: object,
		_Operations: Array<typeof BaseOperation>,
		callback: (result?: string) => Promise<void>,
	): Promise<void> {
		const { objective } = state.getProgramState("autobot");
		let callbackResponse = "";
		for (const operation of _Operations) {
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
						const errMsg = `The command "${_commandName}" failed to run with the error: "${error.message}"`;
						console.error(errMsg);
						return callback(errMsg);
					}

					// If there is no output, continue
					if (!output) {
						return callback(`The command "${_commandName}" returned successfully.`);
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
						const summary = await OpenAiRoutine.getSummarization("autobot", output, objective);
						console.log(`Summary:\n${summary}\n`);
						callbackResponse = `You just ran the command "${_commandName}" with the arguments ${JSON.stringify(
							_commandArgs,
						)}.\n\nThe result of your command was:\n"${summary}".`;
					} else {
						console.log(`\nOutput:\n${output}\n`);
						callbackResponse = `You just ran the command "${_commandName}" with the arguments ${JSON.stringify(
							_commandArgs,
						)}.\n\nThe result of your command was:\n"${output}".`;
					}
				}
			}
		}

		callback(callbackResponse);
	}
}
