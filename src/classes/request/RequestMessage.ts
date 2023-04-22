import { ChatCompletionRequestMessage, ChatCompletionResponseMessage, ChatCompletionRequestMessageRoleEnum } from "openai";

type RequestMessageHistory = {
	userPrompt: ChatCompletionRequestMessage;
	gptResponse?: ChatCompletionResponseMessage;
}[];

export class RequestMessage {
	private history: RequestMessageHistory = [];

	public generateMessagesWithHistory(): ChatCompletionRequestMessage[] {
		// Compile everything into a single prompt
		let messages = [];

		const conversationHistory = this.generateConversationHistory();
		if (conversationHistory.length > 0) {
			let prompt = `Consider the following history for the conversation:\n\n`;
			for (const item of conversationHistory) {
				prompt += `Prompt: ${item.prompt}\nResponse: ${item.response}\n\n`;
			}

			messages.push({
				role: ChatCompletionRequestMessageRoleEnum.System,
				content: prompt,
			});
		}

		// Add the user's prompt
		messages.push({
			role: ChatCompletionRequestMessageRoleEnum.User,
			content: this.history[this.history.length - 1].userPrompt.content,
		});

		return messages;
	}

	public generateConversationHistory(): any {
		const conversationHistory = [];

		for (const item of this.history) {
			if (!item.gptResponse) {
				continue;
			}

			conversationHistory.push({
				prompt: item.userPrompt.content,
				response: item.gptResponse.content,
			});
		}

		return conversationHistory;
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
}
