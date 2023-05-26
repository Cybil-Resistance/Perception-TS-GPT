import State from "@src/classes/state/State";
import OpenAIRoutine from "@src/routines/openai";

export default class ChatGPTBotAdapter {
	public static getName(): string {
		return "ChatGPT Bot";
	}

	public static getDescription(): string {
		return "Chat with GPT";
	}

	public static async run(state?: State): Promise<void> {
		OpenAIRoutine.promptWithHistory(state, ChatGPTBotAdapter.run.bind(this, state));
	}
}
