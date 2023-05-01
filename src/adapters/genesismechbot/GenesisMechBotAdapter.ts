import { PromptCLI } from "@src/classes/prompt";
import axios from "axios";
import { GENESIS_MECH_RACE_SYSTEM_PROMPT, GENESIS_MECH_RACE_USER_PROMPT } from "./config/prompts";
import { RequestMessage } from "@src/classes/request";
import { OpenAI } from "@src/classes/llm";
import { AdapterRoute, BaseBotAdapter } from "@src/adapters/BaseBotAdapter";
import express from "express";

export default class GenesisMechBotAdapter extends BaseBotAdapter {
	public static getName(): string {
		return "Genesis Mech Bot";
	}

	public static getDescription(): string {
		return "Narrate a race among Genesis Mechs";
	}

	public static getRoutes(): AdapterRoute[] {
		return [
			{
				endpoint: "/mechs/race",
				method: "GET",
				handler: this.apiRoute.bind(this),
			},
		];
	}

	public static async apiRoute(req: express.Request, res: express.Response): Promise<void> {
		// Get the request message from the query
		let { mechIds } = req.query;

		if (!mechIds) {
			res.status(400).send(
				JSON.stringify({
					error: "No mech IDs provided.",
				}),
			);
			return;
		}

		try {
			// Split the list, turn into an array
			mechIds = mechIds.map((id) => parseInt(id.trim(), 10));

			// Get the response from the bot
			const response: string = await this.getRaceResponse(mechIds);

			// Send the response
			res.send(
				JSON.stringify({
					response,
				}),
			);
		} catch (error) {
			res.status(500).send(
				JSON.stringify({
					error: error.message,
				}),
			);
		}
	}

	public static async run(): Promise<void> {
		// Ask the user for a list of Genesis Mech IDs
		const prompt: string = await PromptCLI.text("Provide a comma-separated list of Genesis Mech IDs:");

		// Split the list, turn into an array
		const mechIds: number[] = prompt.split(",").map((id) => parseInt(id.trim(), 10));

		// Get the response
		await this.getRaceResponse(mechIds);

		// Ask the user if they want to run another race
		const repeat: boolean = await PromptCLI.confirm("Run another race?");

		if (repeat) {
			await this.run();
		}
	}

	public static async getRaceResponse(mechIds: number[]): Promise<string> {
		// For each mech ID, get the metadata from the API
		const mechs: string[] = [];
		for (const mechId of mechIds) {
			// API URL
			const url: string = `https://m.cyberbrokers.com/eth/mech/${mechId}`;

			// Get the data from the API
			const response = await axios.get(url);

			const metadata = {
				name: response.data.name,
				description: response.data.clean_description,
				endurance: response.data.attributes.find((attribute: any) => attribute.trait_type === "Endurance").value,
				speed: response.data.attributes.find((attribute: any) => attribute.trait_type === "Speed").value,
				power: response.data.attributes.find((attribute: any) => attribute.trait_type === "Power").value,
				model: response.data.attributes.find((attribute: any) => attribute.trait_type === "Model").value,
				height: response.data.attributes.find((attribute: any) => attribute.trait_type === "Height").value,
				weight: response.data.attributes.find((attribute: any) => attribute.trait_type === "Weight").value,
				special_ability: response.data.attributes.find((attribute: any) => attribute.trait_type === "Special Ability").value,
			};

			// Construct the mech string
			let mechString: string = "";
			for (const _key in metadata) {
				const key = _key
					.split("_")
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(" ");
				mechString += `${key}: ${metadata[_key]}\n`;
			}

			mechs.push(mechString);

			console.log(`Retrieved metadata for Genesis Mech #${mechId}:`);
			console.log(mechs[mechs.length - 1]);
		}

		// Construct the prompt
		const openAI = new OpenAI();
		const requestMessage = new RequestMessage();

		// Set up the system prompts
		requestMessage.addSystemPrompt(GENESIS_MECH_RACE_SYSTEM_PROMPT.replaceAll("{{MECHS}}", mechs.join("\n")));

		// Construct the request message based on history
		requestMessage.addUserPrompt(GENESIS_MECH_RACE_USER_PROMPT);

		// Estimate the current token use
		const tokenUse = requestMessage.estimateCurrentTokenUse();

		// Add some story context
		if (tokenUse > 3500) {
			throw new Error(`Too many tokens in use.`);
		}

		// Submit the request to OpenAI, and cycle back to handle the response
		const messages = requestMessage.generateMessages();

		// Get the response and handle it
		const response = await openAI.getCompletion(messages);

		// Store GPT's reponse
		requestMessage.addGPTResponse(response);

		// Report the response to the user
		console.log(`\nGPT Response:\n${response.content}\n`);

		return response.content;
	}
}
