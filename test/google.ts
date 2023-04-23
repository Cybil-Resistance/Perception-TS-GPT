import { expect } from "chai";
import Google, { GoogleSearchResult } from "@src/operations/google";

describe("Operation: Google Official Search", () => {
    it("should return search result URLs", async () => {
        const query = "OpenAI";
        const numResults = 3;

        const searchResults: GoogleSearchResult = await Google.run(query, numResults);

        if (typeof searchResults === "string") {
            expect(searchResults).not.to.include("Error");
        } else {
            expect(searchResults).to.have.lengthOf(numResults);
            searchResults.forEach((url: string) => {
                expect(url).to.be.a("string");
                expect(url).to.include("http");
            });
        }
    });
});
