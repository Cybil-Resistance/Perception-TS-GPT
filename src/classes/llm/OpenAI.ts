import {
	Configuration,
	OpenAIApi,
	ChatCompletionRequestMessage,
	ChatCompletionResponseMessage,
	ChatCompletionRequestMessageRoleEnum,
} from "openai";
import { config as cfg } from "@src/config";
import { IncomingMessage } from "http";

export type OpenAICompletionArguments = {
	messages: ChatCompletionRequestMessage[];
	model?: string;
	temperature?: number;
	n?: number;
	onMessageCallback?: (response: string) => void;
	onCompleteCallback?: (response: ChatCompletionResponseMessage) => void;
	numCompletionAttempts?: number;
};

export class OpenAI {
	private openai: OpenAIApi;
	private maxCompletionAttempts: number = 3;

	constructor() {
		const configuration = new Configuration({
			apiKey: cfg.OPENAI_API_KEY,
		});

		this.openai = new OpenAIApi(configuration);
	}

	public async getCompletion(args: OpenAICompletionArguments): Promise<ChatCompletionResponseMessage> {
		// Retrieve the arguments
		const {
			messages,
			model = cfg.FAST_LLM_MODEL,
			temperature = cfg.OPENAI_TEMPERATURE,
			n = 1,
			onMessageCallback,
			onCompleteCallback,
			numCompletionAttempts = 0,
		} = args;

		console.log(`Using OpenAI (${model}, T=${temperature}) to respond...`);

		try {
			const response = await this.openai.createChatCompletion(
				{
					model: model,
					messages: messages,
					temperature: temperature,
					n: n,
					stream: true,
				},
				{ responseType: "stream" },
			);

			const stream = response.data as unknown as IncomingMessage;
			const contentChunks = [];

			stream.on("data", (chunk: Buffer) => {
				// Messages in the event stream are separated by a pair of newline characters.
				const payloads = chunk.toString().split("\n\n");
				for (const payload of payloads) {
					if (payload.includes("[DONE]")) return;
					if (payload.startsWith("data:")) {
						const data = payload.replaceAll(/(\n)?^data:\s*/g, ""); // in case there's multiline data event
						try {
							const delta = JSON.parse(data.trim());
							if (delta.choices[0].delta?.content) {
								if (onMessageCallback) {
									onMessageCallback(delta.choices[0].delta?.content);
								}

								contentChunks.push(delta.choices[0].delta?.content || "");
							}
						} catch (error) {
							console.log(`Error with JSON.parse and ${payload}.\n${error}`);
						}
					}
				}
			});

			stream.on("error", (e: Error) => {
				// Notify the user of an error
				console.error(e.message);

				// If we exceed the number of valid attempts, fail out
				if (numCompletionAttempts >= this.maxCompletionAttempts) {
					console.error(`Exceeded maximum number of completion attempts (${this.maxCompletionAttempts})`);
					process.exit();
				}

				// Try to run again
				this.getCompletion({ ...args, numCompletionAttempts: (args.numCompletionAttempts || 0) + 1 });
			});

			return new Promise((resolve) => {
				stream.on("end", () => {
					// End the line
					if (onMessageCallback) {
						onMessageCallback("\n");
					}

					// Construct the ChatCompletionResponseMessage
					const response: ChatCompletionResponseMessage = {
						content: contentChunks.join(""),
						role: ChatCompletionRequestMessageRoleEnum.Assistant,
					};

					// Return the content
					if (onCompleteCallback) {
						onCompleteCallback(response);
					}
					resolve(response);
				});
			});
		} catch (error) {
			console.error(
				`Error with OpenAI API, attempt ${args.numCompletionAttempts} out of ${this.maxCompletionAttempts}: ${error.message}`,
			);

			// Wait just a bit before trying again
			await new Promise((resolve) => setTimeout(resolve, 500));

			// If we exceed the number of valid attempts, fail out
			if (numCompletionAttempts >= this.maxCompletionAttempts) {
				console.error(`Exceeded maximum number of completion attempts (${this.maxCompletionAttempts})`);
				process.exit();
			}

			// Try to run again
			return this.getCompletion({ ...args, numCompletionAttempts: (args.numCompletionAttempts || 0) + 1 });
		}
	}
}
