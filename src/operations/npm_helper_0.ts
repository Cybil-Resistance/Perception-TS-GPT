import fs from "fs";
import DirectoryList from "./directory_list";

/**
 * Class that helps reconcile whether packages need to be installed by checking all imports of all files within a path recursively and comparing it to installed packages from package.json file.
 **/
export default class NpmHelper {
	public static getName(): string {
		return "Package Reconciliation";
	}

	public static getDescription(): string {
		return "Checks all imports of all files within a path recursively and compares it to installed packages from package.json file to determine if any packages need to be installed.";
	}

	public static async run(path: string): Promise<boolean> {
		// Get list of installed packages from package.json file
		const packageJson = require(`${path}/package.json`);
		const installedPackages = Object.keys(packageJson.dependencies);
		const devDependencies = Object.keys(packageJson.devDependencies);

		// Recursively search for all files within the path and check their imports
		const directoryList = await DirectoryList.run(path, true, true);
		const files = directoryList.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

		const imports = await Promise.all(files.map((file) => getImports(file)));

		// Flatten the array of imports and remove duplicates
		const flattenedImports = Array.from(new Set(imports.flat()));

		// Check if any imported packages are not installed
		const missingPackages = flattenedImports.filter((pkg) => !installedPackages.includes(pkg) && !devDependencies.includes(pkg));

		// Return true if all packages are installed, false otherwise
		return missingPackages.length === 0;
	}

	/**
	 * Returns a list of all imports within a file.
	 **/
	private static async getImports(file: string): Promise<string[]> {
		const contents = await fs.readFileSync(file, "utf-8");
		const importRegex = /import\s+(?:(?:\w+\s+from\s+)?[\'"][^\'"]+[\'"]|{[^}]+})/g;
		const requireRegex = /require\s*\(\s*[\'"](.+)[\'"]\s*\)/g;

		const imports = [];
		let match;
		while ((match = importRegex.exec(contents)) !== null) {
			const importStatement = match[0];
			const packageName = importStatement.match(/['"]([^'"]+)['"]/)[1];
			imports.push(packageName);
		}
		while ((match = requireRegex.exec(contents)) !== null) {
			imports.push(match[1]);
		}

		return imports;
	}
}
