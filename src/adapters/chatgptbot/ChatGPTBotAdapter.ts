import OpenAIRoutine from "@src/routines/openai";

export default class ChatGPTBotAdapter {
	public static getName(): string {
		return "ChatGPT Bot";
	}

	public static getDescription(): string {
		return "A bot that emulates the behavior of Chat GPT with history of a conversation";
	}

	public static async run(): Promise<void> {
		OpenAIRoutine.promptWithHistory("chatgptbot", ChatGPTBotAdapter.run);
	}
}
