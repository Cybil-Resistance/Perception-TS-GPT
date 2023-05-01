import BaseOperation, { OperationFormat } from "./base_operation";
import fs from "fs";
import path from "path";

export default class FileWrite extends BaseOperation {
	private static workingDirectory: string;

	public static getName(): string {
		return "Write to file";
	}

	public static getDescription(): string {
		return "Writes contents to a file.";
	}

	public static getOperations(): OperationFormat[] {
		return [
			{
				method: "write_file",
				call: this.run,
				args: [
					{
						key: "file_path",
						type: "string",
					},
					{
						key: "contents",
						type: "string",
					},
				],
			},
		];
	}

	public static setWorkingDirectory(workingDirectory: string): void {
		this.workingDirectory = workingDirectory;
	}

	public static async run(filePath: string, fileContents: string): Promise<void> {
		// If the working directory is not set, default to the tmp directory
		if (!this.workingDirectory) {
			this.workingDirectory = process.cwd() + "/tmp/";
		}

		// If the filepath does not have a directory component, then prepend the working directory
		if (!filePath.includes("/") || filePath.startsWith("./")) {
			filePath = this.workingDirectory + "/" + filePath;
		}

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
