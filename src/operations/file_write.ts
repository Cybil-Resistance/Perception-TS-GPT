import fs from "fs";
import path from "path";

export default class FileWrite {
	private static workingDirectory: string;

	public static getName(): string {
		return "Write to file";
	}

	public static getDescription(): string {
		return "Writes contents to a file at a given location";
	}

	public static setWorkingDirectory(workingDirectory: string): void {
		this.workingDirectory = workingDirectory;
	}

	public static async run(filePath: string, fileContents: string): Promise<void> {
		// Resolve the file path to an absolute path
		filePath = path.resolve(filePath);

		// Ensure that the file path stays within the confines of the defined directory
		if (!filePath.startsWith(this.workingDirectory)) {
			throw new Error("File path is not within the current working directory.");
		}

		try {
			fs.writeFileSync(filePath, fileContents, { encoding: "utf-8" });
		} catch (error) {
			console.error(`Error writing to file: ${error.message}`);
			throw error;
		}
	}
}
