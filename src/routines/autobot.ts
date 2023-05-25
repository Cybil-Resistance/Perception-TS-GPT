import { RequestMessage } from "@src/classes/request";
import BaseOperation from "../operations/base_operation";
import OpenAiRoutine from "./openai";
import { PromptCLI } from "@src/classes/prompt";

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

	public static async promptOperation(
		_commandName: string,
		_commandArgs: string[],
		_promptsToRunRemaining: number,
		_requestMessage: RequestMessage,
	): Promise<[boolean, number]> {
		// Prompt the user if they'd like to continue
		if (_promptsToRunRemaining <= 0) {
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

			_promptsToRunRemaining = selection;
		} else {
			console.log(`Auto-approving the command "${_commandName}" with the arguments "${JSON.stringify(_commandArgs)}".`);
			console.log(`Auto-approvals remaining: ${_promptsToRunRemaining}`);
		}

		if (_promptsToRunRemaining == 0) {
			_requestMessage.addSystemPrompt(`User rejected your suggested command. Re-evaluate your options and try again.`);
			return [false, _promptsToRunRemaining];
		} else if (_promptsToRunRemaining < 0) {
			process.exit();
		}

		// Decrement the prompts to run
		_promptsToRunRemaining--;

		return [true, _promptsToRunRemaining];
	}

	public static async issueOperation(
		_commandName: string,
		_commandArgs: object,
		_objective: string,
		_requestMessage: RequestMessage,
		_Operations: Array<typeof BaseOperation>,
		callback: () => Promise<void>,
	): Promise<void> {
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
						_requestMessage.addSystemPrompt(errMsg);
						return callback();
					}

					// If there is no output, continue
					if (!output) {
						_requestMessage.addSystemPrompt(`The command "${_commandName}" returned successfully.`);
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
						const summary = await OpenAiRoutine.getSummarization("autobot", output, _objective);
						console.log(`Summary:\n${summary}\n`);
						_requestMessage.addSystemPrompt(`The result of your command was: "${summary}".`);
					} else {
						console.log(`\nOutput:\n${output}\n`);
						_requestMessage.addSystemPrompt(`The result of your command was: "${output}".`);
					}
				}
			}
		}

		callback();
	}
}
