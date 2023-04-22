import { OpenAI } from "@src/classes/llm";

(async (): Promise<void> => {
	const openAI = new OpenAI();
	const response = await openAI.getCompletion("Hello world");
	console.log(response);
})();
