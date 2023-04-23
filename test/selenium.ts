import { expect } from "chai";
import Selenium from "@src/operations/selenium";

describe("Operation: Browse web page text with Selenium", () => {
	it("should return scraped text from a website", async () => {
		// Wikipedia article on Rhinoceroses
		const url = "https://en.wikipedia.org/w/index.php?title=Rhinoceros&oldid=1147829837";

		const scrapedText: string = await Selenium.run(url);

		expect(scrapedText).to.be.a("string");
		expect(scrapedText).to.include("Rhinoceros");
	});
});
