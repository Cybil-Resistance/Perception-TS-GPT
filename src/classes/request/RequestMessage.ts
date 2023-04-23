import { config as cfg } from "@src/config";
import { ChatCompletionRequestMessage, ChatCompletionResponseMessage, ChatCompletionRequestMessageRoleEnum } from "openai";

type RequestMessageHistoryBlock = {
	prompts: (ChatCompletionRequestMessage | string)[];
	gptResponse?: ChatCompletionResponseMessage;
};

type RequestMessageHistory = RequestMessageHistoryBlock[];

export class RequestMessage {
	private currentPrompts: RequestMessageHistoryBlock = { prompts: [] };
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
		this.currentPrompts.prompts.push("HISTORY_CONTEXT_HERE");
	}

	public generateHistoryContext(): ChatCompletionRequestMessage | void {
		function formatHistoryItem(item: { prompt: ChatCompletionRequestMessage; response: ChatCompletionResponseMessage }): string {
			return `My prompt: ${item.prompt.content}\nYour response: ${item.response.content}\n\n`;
		}

		// Prepare the history context
		const historyContext = `This reminds you of these events from your past:\n\n`;

		// Get the conversation history
		let conversationHistory = this.generateConversationHistory();

		// Estimate the length of the conversation history
		let promptEstimatedLength = 0;
		do {
			// If the conversation history is too long, remove the oldest item
			if (promptEstimatedLength > cfg.FAST_TOKEN_LIMIT && conversationHistory.length > 0) {
				this.history.shift();
				conversationHistory = this.generateConversationHistory();
			}

			promptEstimatedLength = this.estimateTokens(
				this.currentPrompts.prompts.reduce(
					(acc, item: ChatCompletionRequestMessage | string) => (typeof item === "string" ? acc : acc + item.content),
					"",
				) +
					historyContext +
					conversationHistory.reduce((acc, item) => acc + formatHistoryItem(item), ""),
			);

			// Debugging
			//console.log(promptEstimatedLength, cfg.FAST_TOKEN_LIMIT, conversationHistory.length)
		} while (promptEstimatedLength > cfg.FAST_TOKEN_LIMIT && conversationHistory.length > 0);

		if (conversationHistory.length > 0) {
			let prompt = historyContext;
			for (const item of conversationHistory) {
				prompt += formatHistoryItem(item);
			}

			return {
				role: ChatCompletionRequestMessageRoleEnum.System,
				content: prompt,
			};
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
			if (typeof item === "string") {
				if (item === "HISTORY_CONTEXT_HERE") {
					const historyContext = this.generateHistoryContext();
					if (historyContext) {
						messages.push();
					}
				}
			} else {
				messages.push(item);
			}
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
				if (typeof prompt === "string") {
					continue;
				}

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

	public estimateTokens(text: string): number {
		const wordCount = text.split(" ").length;
		const charCount = text.length;
		const tokensCountWordEst = wordCount / 0.75;
		const tokensCountCharEst = charCount / 4;

		return Math.floor(Math.max(tokensCountWordEst, tokensCountCharEst));
	}
}
