import { Configuration, OpenAIApi, ChatCompletionResponseMessage } from "openai";
import cfg from "@src/config";

export class OpenAI {
	private openai: OpenAIApi;

	constructor() {
		const configuration = new Configuration({
			apiKey: cfg.OPENAI_API_KEY,
		});

		this.openai = new OpenAIApi(configuration);
	}

	public async getCompletion(
		prompt: string,
		model: string = cfg.FAST_LLM_MODEL,
		temperature: number = 0,
		n: number = 1,
		max_tokens: number = cfg.FAST_TOKEN_LIMIT,
	): Promise<ChatCompletionResponseMessage> {
		const completion = await this.openai.createChatCompletion({
			model: model,
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: temperature,
			n: n,
			max_tokens: max_tokens,
		});

		return completion.data.choices[0].message;
	}
}
