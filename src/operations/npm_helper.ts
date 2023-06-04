import BaseOperation from "./base_operation";
import fs from "fs";

export default class NpmHelper extends BaseOperation {
	public static getName(): string {
		return "Get Imported NPM Packages";
	}

	public static getDescription(): string {
		return "List of all imported NPM packages.";
	}

	public static getBuiltInNodeModules(): string[] {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return require("repl")._builtinLibs;
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
				const packageName = (statement as string).match(/['"].+?['"]/)?.[0].replace(/['"]/g, "");
				if (packageName) {
					importedPackages.push(packageName);
				}
			});

			// Extract packages from require statements
			requireStatements.forEach((statement) => {
				const packageName = (statement as string).match(/['"].+?['"]/)?.[0].replace(/['"]/g, "");
				if (packageName) {
					importedPackages.push(packageName);
				}
			});
		}

		// Remove duplicates and return the list of imported packages
		const builtInNodeModules = this.getBuiltInNodeModules();
		return [...new Set(importedPackages)].filter((packageName) => !builtInNodeModules.includes(packageName));
	}
}
