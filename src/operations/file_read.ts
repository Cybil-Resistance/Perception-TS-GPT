import fs from "fs";
import path from "path";

/**
 * The operation should be able to read to a file. It should only use synchronous methods. It should also allow setting the working directory, and it should not allow reading from files or folders that are outside of the working directory or its children.
 **/

export default class FileRead {
	private static workingDirectory: string;

	public static getName(): string {
		return "File Read";
	}

	public static getDescription(): string {
		return "Reads a file and returns the contents.";
	}

	public static setWorkingDirectory(directory: string): void {
		const resolvedPath = path.resolve(directory);
		if (fs.existsSync(resolvedPath) && fs.lstatSync(resolvedPath).isDirectory()) {
			FileRead.workingDirectory = resolvedPath;
		} else {
			throw new Error("Invalid directory path.");
		}
	}

	public static run(filePath: string): string {
		const resolvedPath = path.resolve(FileRead.workingDirectory, filePath);
		if (!resolvedPath.startsWith(FileRead.workingDirectory)) {
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
