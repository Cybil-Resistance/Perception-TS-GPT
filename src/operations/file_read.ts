import BaseOperation, { OperationFormat } from "./base_operation";
import fs from "fs";
import path from "path";

export default class FileRead extends BaseOperation {
	private static workingDirectory: string;

	public static getName(): string {
		return "File Read";
	}

	public static getDescription(): string {
		return "Reads a file and returns the contents.";
	}

	public static getOperations(): OperationFormat[] {
		return [
			{
				method: "read_file",
				call: this.run,
				args: [
					{
						key: "file_path",
						type: "string",
					},
				],
			},
		];
	}

	public static setWorkingDirectory(directory: string): void {
		const resolvedPath = path.resolve(directory);
		if (fs.existsSync(resolvedPath) && fs.lstatSync(resolvedPath).isDirectory()) {
			this.workingDirectory = resolvedPath;
		} else {
			throw new Error("Invalid directory path.");
		}
	}

	public static run(filePath: string): string {
		// If the working directory is not set, default to the tmp directory
		if (!this.workingDirectory) {
			this.workingDirectory = process.cwd() + "/tmp/";
		}

		// If the filepath does not have a directory component, then prepend the working directory
		if (!filePath.includes("/") || filePath.startsWith("./")) {
			filePath = this.workingDirectory + "/" + filePath;
		}

		const resolvedPath = path.resolve(this.workingDirectory, filePath);
		if (!resolvedPath.startsWith(this.workingDirectory)) {
			throw new Error("File path is outside of the working directory or its children.");
		}
		if (!fs.existsSync(resolvedPath)) {
			throw new Error("File does not exist.");
		}
		if (!fs.lstatSync(resolvedPath).isFile()) {
			throw new Error("Path is not a file.");
		}
		return fs.readFileSync(resolvedPath, "utf-8");
	}
}
