import BaseOperation, { OperationFormat } from "./base_operation";
import { google } from "googleapis";
import { config as cfg } from "@src/config";

export type GoogleSearchResult = string | string[];

export default class Google extends BaseOperation {
	public static getName(): string {
		return "Google Search";
	}

	public static getDescription(): string {
		return "Search Google for information.";
	}

	public static getOperations(): OperationFormat[] {
		return [
			{
				method: "search_google",
				call: this.run,
				args: [
					{
						key: "query",
						type: "string",
					},
				],
			},
		];
	}

	public static async run(query: string, numResults: number = 8): Promise<GoogleSearchResult> {
		try {
			// Get the Google API key and Custom Search Engine ID from the config file
			const apiKey = cfg.GOOGLE_API_KEY;
			const customSearchEngineId = cfg.CUSTOM_SEARCH_ENGINE_ID;

			// Initialize the Custom Search API service
			const customSearch = google.customsearch("v1");

			// Send the search query and retrieve the results
			const result = await customSearch.cse.list({
				q: query,
				cx: customSearchEngineId,
				num: numResults,
				auth: apiKey,
			});

			// Extract the search result items from the response
			const searchResults = result.data.items || [];

			// Create a list of only the URLs from the search results
			const searchResultsLinks = searchResults.map((item) => item.link);

			// Return the list of search result URLs
			return searchResultsLinks;
		} catch (e) {
			// Handle errors in the API call
			if (e.code === 403 && e.message.includes("invalid API key")) {
				return "Error: The provided Google API key is invalid or missing.";
			} else {
				return `Error: ${e}`;
			}
		}
	}
}
