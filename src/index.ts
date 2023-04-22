import { Configuration, OpenAIApi } from "openai";
import cfg from "./config/config";

(async () => {
	const configuration = new Configuration({
		apiKey: cfg.OPENAI_API_KEY,
	  });
	  const openai = new OpenAIApi(configuration);
	  const response = await openai.listModels();

	  console.log(response.data);
})();
