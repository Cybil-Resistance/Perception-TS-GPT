import { ChatCompletionRequestMessage, ChatCompletionResponseMessage, ChatCompletionRequestMessageRoleEnum } from "openai";

type RequestMessageHistory = {
	userPrompt: ChatCompletionRequestMessage;
	gptResponse?: ChatCompletionResponseMessage;
}[];

export class RequestMessage {
	private systemPrompt: ChatCompletionRequestMessage;
	private useSystemTime: boolean;
	private history: RequestMessageHistory = [];

	public setSystemPrompt(prompt: string): void {
		this.systemPrompt = {
			role: ChatCompletionRequestMessageRoleEnum.System,
			content: prompt,
		};
	}

	public includeSystemTime(include: boolean): void {
		this.useSystemTime = include;
	}

	public addUserPrompt(prompt: string): void {
		this.history.push({
			userPrompt: {
				role: ChatCompletionRequestMessageRoleEnum.User,
				content: prompt,
			},
		});
	}

	public addGPTResponse(response: ChatCompletionResponseMessage): void {
		this.history[this.history.length - 1].gptResponse = response;
	}

	public generateMessagesWithHistory(): ChatCompletionRequestMessage[] {
		// Compile everything into a single prompt
		const messages = [];

		// Add the prompt qualifiers
		messages.push(this.systemPrompt);

		// Add system time if requested
		if (this.useSystemTime) {
			messages.push({
				role: ChatCompletionRequestMessageRoleEnum.System,
				content: `The current time is ${new Date().toLocaleString()}.`,
			});
		}

		// Add the conversation history
		const conversationHistory = this.generateConversationHistory();
		if (conversationHistory.length > 0) {
			let prompt = `This reminds you of these events from your past:\n\n`;
			for (const item of conversationHistory) {
				prompt += item.response.content;
				//prompt += `Prompt: ${item.prompt.content}\nResponse: ${item.response.content}\n\n`;
			}

			messages.push({
				role: ChatCompletionRequestMessageRoleEnum.System,
				content: prompt,
			});
		}

		// Enforce the response format
		messages.push({
			role: ChatCompletionRequestMessageRoleEnum.User,
			content: "Determine which next command to use, and respond using the JSON format specified.",
		});

		// Add the user's prompt
		messages.push({
			role: ChatCompletionRequestMessageRoleEnum.User,
			content: this.history[this.history.length - 1].userPrompt.content,
		});

		return messages;
	}

	public generateConversationHistory(): { prompt: ChatCompletionRequestMessage; response: ChatCompletionResponseMessage }[] {
		const conversationHistory = [];

		for (const item of this.history) {
			if (!item.gptResponse) {
				continue;
			}

			conversationHistory.push({
				prompt: item.userPrompt,
				response: item.gptResponse,
			});
		}

		return conversationHistory;
	}
}
