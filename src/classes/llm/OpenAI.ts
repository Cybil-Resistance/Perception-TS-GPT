import {
	Configuration,
	OpenAIApi,
	ChatCompletionRequestMessage,
	ChatCompletionResponseMessage,
	ChatCompletionRequestMessageRoleEnum,
} from "openai";
import { config as cfg } from "@src/config";

export class OpenAI {
	private openai: OpenAIApi;

	constructor() {
		const configuration = new Configuration({
			apiKey: cfg.OPENAI_API_KEY,
		});

		this.openai = new OpenAIApi(configuration);
	}

	public async getSimplePromptCompletion(
		prompt: string,
		role: ChatCompletionRequestMessageRoleEnum = ChatCompletionRequestMessageRoleEnum.User,
	): Promise<ChatCompletionResponseMessage> {
		return await this.getCompletion([
			{
				role: role,
				content: prompt,
			},
		]);
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
}
