import express from "express";
import fs from "fs";

export type AdapterRoute = {
	endpoint: string;
	method: "GET" | "POST";
	handler: (req: express.Request, res: express.Response) => Promise<void>;
};

export class BaseBotAdapter {
	protected static configPath: string = process.cwd() + "/data/config.json";

	public static getName(): string {
		throw new Error("getName not implemented.");
	}

	public static getDescription(): string {
		throw new Error("getDescription not implemented.");
	}

	public static getRoutes(): AdapterRoute[] {
		return [];
	}

	public static async run(): Promise<void> {
		throw new Error("run not implemented.");
	}

	protected static getConfig(key: string): string {
		// Determine if the config file exists in the data directory
		if (!fs.existsSync(this.configPath)) {
			// Create if not
			fs.writeFileSync(this.configPath, "{}");
		}

		// Read the config file
		const config: string = fs.readFileSync(this.configPath, "utf8");

		// Parse the config file and return the value for the key, or null if not
		return JSON.parse(config)[key] || null;
	}

	protected static setConfig(key: string, value: string): void {
		// Determine if the config file exists in the data directory
		if (!fs.existsSync(this.configPath)) {
			// Create if not
			fs.writeFileSync(this.configPath, "{}");
		}

		// Read the config file
		const config: string = fs.readFileSync(this.configPath, "utf8");

		// Parse the config file
		const configJson: object = JSON.parse(config);

		// Set the value for the key
		configJson[key] = value;

		// Write the config file
		fs.writeFileSync(this.configPath, JSON.stringify(configJson, null, 2));
	}
}
