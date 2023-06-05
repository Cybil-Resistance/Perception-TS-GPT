import OpenAIRoutine from "@src/routines/openai";
import { BaseBotAdapter } from "@src/adapters/BaseBotAdapter";

export default class ChatGPTBotAdapter extends BaseBotAdapter {
	public static getName(): string {
		return "ChatGPT Bot";
	}

	public static getDescription(): string {
		return "Chat with GPT";
	}

	public static async run(): Promise<void> {
		OpenAIRoutine.promptWithHistory(this.state, ChatGPTBotAdapter.run.bind(this));
	}
}
