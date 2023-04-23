import { Builder, By, WebDriver, WebElement, until } from "selenium-webdriver";
import { Options as ChromeOptions } from "selenium-webdriver/chrome";
import { JSDOM } from "jsdom";
import { config as cfg } from "@src/config";

export default class Selenium {
	public static getName(): string {
		return "Browse web page with Selenium";
	}

	public static getDescription(): string {
		return "Browse a web page with Selenium and return the text content.";
	}

	public static async run(url: string): Promise<string> {
		try {
			const options = new ChromeOptions();
			options.addArguments(cfg.USER_AGENT);

			if (process.platform === "linux") {
				options.addArguments("--disable-dev-shm-usage");
				options.addArguments("--remote-debugging-port=9222");
			}

			options.addArguments("--no-sandbox");
			options.addArguments("--headless");
			options.addArguments("--disable-gpu");

			const driver: WebDriver = await new Builder()
				.forBrowser("chrome")
				.setChromeOptions(options)
				.build();

			await driver.get(url);

			const body: WebElement = await driver.wait(
				until.elementLocated(By.tagName("body")),
				10000
			);

			const pageSource: string = await driver.executeScript<string>(
				"return document.body.outerHTML;"
			);

			const dom = new JSDOM(pageSource);
			const { document } = dom.window;

			// Remove all script and style tags, focus on content
			Array.from(document.querySelectorAll("script, style")).forEach((el: WebElement) => el.remove());

			const text = document.body.textContent || "";
			const lines = text.split("\n").map((line: string) => line.trim());
			const chunks = lines.flatMap((line: string) => line.split("  ").map((phrase) => phrase.trim()));
			const cleanedText = chunks.filter((chunk) => chunk).join("\n");

			return cleanedText;
		} catch (e) {
			return `Error: ${e}`;
		}
	}
}
