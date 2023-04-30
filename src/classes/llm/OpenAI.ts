import {
	Configuration,
	OpenAIApi,
	ChatCompletionRequestMessage,
	ChatCompletionResponseMessage,
	ChatCompletionRequestMessageRoleEnum,
} from "openai";
import { config as cfg } from "@src/config";
import { IncomingMessage } from "http";

export class OpenAI {
	private openai: OpenAIApi;

	constructor() {
		const configuration = new Configuration({
			apiKey: cfg.OPENAI_API_KEY,
		});

		this.openai = new OpenAIApi(configuration);
	}

	public async getCompletion(
		messages: ChatCompletionRequestMessage[],
		model: string = cfg.FAST_LLM_MODEL,
		temperature: number = 0,
		n: number = 1,
	): Promise<ChatCompletionResponseMessage> {
		console.log("Waiting for OpenAI to respond...");

		const completion = await this.openai.createChatCompletion({
			model: model,
			messages: messages,
			temperature: temperature,
			n: n,
		});

		return completion.data.choices[0].message;
	}

	public async getCompletionStreaming(
		callback: (response: ChatCompletionResponseMessage) => void,
		messages: ChatCompletionRequestMessage[],
		model: string = cfg.FAST_LLM_MODEL,
		temperature: number = 0,
		n: number = 1,
	): Promise<void> {
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
							process.stdout.write(delta.choices[0].delta?.content);
							contentChunks.push(delta.choices[0].delta?.content || "");
						}
					} catch (error) {
						console.log(`Error with JSON.parse and ${payload}.\n${error}`);
					}
				}
			}
		});

		stream.on("end", () => {
			// End the line
			process.stdout.write("\n");

			// Construct the ChatCompletionResponseMessage
			const response: ChatCompletionResponseMessage = {
				content: contentChunks.join(""),
				role: ChatCompletionRequestMessageRoleEnum.Assistant,
			};

			// Return the content
			callback(response);
		});
		stream.on("error", (e: Error) => console.error(e));
	}
}
