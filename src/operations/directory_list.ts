import BaseOperation, { OperationFormat } from "./base_operation";
import fs from "fs";
import path from "path";

/**
 * Operation Prompt: It should accept a path as an argument, and an optional deep recursive boolean, and it should get all of the files and folders that are in that path, and if the deep recursive boolean is true, then recursively navigate down the tree. The output should be a JSON structure that mimics the folder-file structure, where children are nested inside of their parent folder.
 **/

export default class DirectoryList extends BaseOperation {
	public static getName(): string {
		return "List Directories";
	}

	public static getDescription(): string {
		return "Get all files and folders in a path.";
	}

	public static getOperations(): OperationFormat[] {
		return [
			{
				method: "list_directory_files",
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

	public static run(_path: string, deepRecursive: boolean = false, flatten: boolean = false): object {
		const result = {};
		const stats = fs.statSync(_path);

		if (stats.isDirectory()) {
			const files = fs.readdirSync(_path);

			for (const file of files) {
				const filePath = _path + "/" + file;
				const fileStats = fs.statSync(filePath);

				if (fileStats.isDirectory()) {
					if (deepRecursive && !this.ignoreDirectory(file)) {
						result[file] = this.run(filePath, deepRecursive);
					} else {
						result[file] = {
							type: "directory",
						};
					}
				} else {
					if (this.ignoreFiles(file)) {
						continue;
					}

					const extension = path.extname(file);
					result[file] = {
						type: "file",
						filetype: extension ? extension.slice(1) : null,
					};
				}
			}
		} else {
			throw new Error("Path is not a directory.");
		}

		if (flatten) {
			// New function to flatten keys and append list of keys that lead up to it
			const flattenKeys = (obj, prefix = ""): string[] => {
				const flattenedKeys: string[] = [];
				for (const key in obj) {
					// If the value is an object, recursively call the function
					if (typeof obj[key] === "object") {
						flattenedKeys.push(prefix ? prefix + "/" + key : key);
						flattenedKeys.push(...flattenKeys(obj[key], prefix ? prefix + "/" + key : key));
					}
				}
				return flattenedKeys;
			};

			return flattenKeys(result);
		} else {
			return result;
		}
	}

	private static ignoreDirectory(directory: string): boolean {
		const ignoreDirectories = ["node_modules", ".git", ".vscode", "dist", "build", "tmp", "data"];
		return ignoreDirectories.includes(directory);
	}

	private static ignoreFiles(directory: string): boolean {
		const ignoreDirectories = [
			".env",
			"package-lock.json",
			"yarn.lock",
			".editorconfig",
			".gitignore",
			".prettierrc",
			".eslintrc.json",
			".DS_Store",
		];
		return ignoreDirectories.includes(directory);
	}
}
