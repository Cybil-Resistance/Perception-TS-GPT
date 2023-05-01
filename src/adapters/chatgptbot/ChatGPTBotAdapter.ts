import OpenAIRoutine from "@src/routines/openai";

export default class ChatGPTBotAdapter {
	public static getName(): string {
		return "ChatGPT Bot";
	}

	public static getDescription(): string {
		return "Chat with GPT";
	}

	public static async run(): Promise<void> {
		OpenAIRoutine.promptWithHistory("chatgptbot", ChatGPTBotAdapter.run);
	}
}
