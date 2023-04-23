import { ChatCompletionRequestMessage, ChatCompletionResponseMessage, ChatCompletionRequestMessageRoleEnum } from "openai";

type RequestMessageHistoryBlock = {
	prompts: ChatCompletionRequestMessage[];
	gptResponse?: ChatCompletionResponseMessage;
};

type RequestMessageHistory = RequestMessageHistoryBlock[];

export class RequestMessage {
	private currentPrompts: RequestMessageHistoryBlock = {prompts: []};
	private history: RequestMessageHistory = [];

	public addSystemPrompt(prompt: string): void {
		this.currentPrompts.prompts.push({
			role: ChatCompletionRequestMessageRoleEnum.System,
			content: prompt,
		});
	}

	public addUserPrompt(prompt: string): void {
		this.currentPrompts.prompts.push({
			role: ChatCompletionRequestMessageRoleEnum.User,
			content: prompt,
		});
	}

	public addHistoryContext(): void {
		// Add the conversation history
		const conversationHistory = this.generateConversationHistory();
		if (conversationHistory.length > 0) {
			let prompt = `This reminds you of these events from your past:\n\n`;
			for (const item of conversationHistory) {
				//prompt += item.response.content + "\n\n";
				prompt += `My prompt: ${item.prompt.content}\nYour response: ${item.response.content}\n\n`;
			}

			this.currentPrompts.prompts.push({
				role: ChatCompletionRequestMessageRoleEnum.System,
				content: prompt,
			});
		}
	}

	public addGPTResponse(response: ChatCompletionResponseMessage): void {
		this.currentPrompts.gptResponse = response;
		this.history.push(this.currentPrompts);
		this.currentPrompts = { prompts: [] };
	}

	public generateMessages(): ChatCompletionRequestMessage[] {
		// Compile everything into a single prompt
		const messages = [];
		for (const item of this.currentPrompts.prompts) {
			messages.push(item);
		}

		// If using debug mode, print out the messages
		//console.debug(messages);

		// Return the compiled prompt
		return messages;
	}

	public generateConversationHistory(): { prompt: ChatCompletionRequestMessage; response: ChatCompletionResponseMessage }[] {
		const conversationHistory = [];

		for (const item of this.history) {
			if (!item.gptResponse) {
				continue;
			}

			for (const prompt of item.prompts) {
				if (prompt.role === ChatCompletionRequestMessageRoleEnum.User) {
					conversationHistory.push({
						prompt: prompt,
						response: item.gptResponse,
					});

					continue;
				}
			}
		}

		return conversationHistory;
	}
}
