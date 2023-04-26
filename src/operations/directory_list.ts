import fs from "fs";
import path from "path";

/**
 * Operation Prompt: It should accept a path as an argument, and an optional deep recursive boolean, and it should get all of the files and folders that are in that path, and if the deep recursive boolean is true, then recursively navigate down the tree. The output should be a JSON structure that mimics the folder-file structure, where children are nested inside of their parent folder.
 **/

export default class DirectoryList {
	public static getName(): string {
		return "List Directories";
	}

	public static getDescription(): string {
		return "Get all files and folders in a path and return a JSON structure that mimics the folder-file structure.";
	}

	public static async run(_path: string, deepRecursive: boolean = false): Promise<object> {
		const result = {};
		const stats = fs.statSync(_path);

		if (stats.isDirectory()) {
			const files = fs.readdirSync(_path);

			for (const file of files) {
				const filePath = _path + "/" + file;
				const fileStats = fs.statSync(filePath);

				if (fileStats.isDirectory()) {
					if (deepRecursive) {
						result[file] = await this.run(filePath, deepRecursive);
					} else {
						result[file] = {};
					}
				} else {
					const extension = path.extname(file);
					result[file] = {
						type: "file",
						filetype: extension ? extension.slice(1) : null
					};
				}
			}
		} else {
			throw new Error("Path is not a directory.");
		}

		return result;
	}
}
