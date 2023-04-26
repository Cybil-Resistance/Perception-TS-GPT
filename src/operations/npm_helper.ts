import fs from "fs";

export default class NpmHelper {
	public static getName(): string {
		return "Get Imported Packages";
	}

	public static getDescription(): string {
		return "Receive an array of filepaths, open all of those files and find all import and require statements. Pull the packages out of the import and require statements, and create a list of all imported packages.";
	}

	public static async run(filePaths: string[]): Promise<string[]> {
		const importedPackages: string[] = [];

		for (const filePath of filePaths) {
			const fileContent = fs.readFileSync(filePath, "utf-8");

			// Find all import statements
			const importStatements = fileContent.match(/import\s.+?from\s['"].+?['"]/g) || [];

			// Find all require statements
			const requireStatements = fileContent.match(/require\s*\(['"].+?['"]\)/g) || [];

			// Extract packages from import statements
			importStatements.forEach((statement) => {
				const packageName = statement.match(/['"].+?['"]/)?.[0].replace(/['"]/g, "");
				if (packageName) {
					importedPackages.push(packageName);
				}
			});

			// Extract packages from require statements
			requireStatements.forEach((statement) => {
				const packageName = statement.match(/['"].+?['"]/)?.[0].replace(/['"]/g, "");
				if (packageName) {
					importedPackages.push(packageName);
				}
			});
		}

		// Remove duplicates and return the list of imported packages
		return [...new Set(importedPackages)];
	}
}
