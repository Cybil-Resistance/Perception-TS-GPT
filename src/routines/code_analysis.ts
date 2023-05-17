import DirectoryList from "@src/operations/directory_list";
import AnalyzeTSFile, { TSFileStructure } from "@src/operations/analyze_ts_file";

export default class CodeAnalysisRoutine {
	private static rootDirectory: string;

	public static getName(): string {
		return "Code Analysis routine";
	}

	public static getDescription(): string {
		return "Analyze code and program for AI use";
	}

	public static setRootDirectory(directory: string): void {
		this.rootDirectory = directory;
	}

	public static getProgramFiles(deepRecursive?: boolean): object {
		return DirectoryList.run(this.rootDirectory, deepRecursive);
	}

	public static listFilePaths(files: object, parentDirectory: string): string[] {
		let compressedFiles: string[] = [];

		for (const filename in files) {
			if (!("type" in files[filename]) || typeof files[filename].type !== "string") {
				compressedFiles = compressedFiles.concat(
					this.listFilePaths(files[filename], (parentDirectory ? parentDirectory + "/" : "") + filename),
				);
			} else {
				compressedFiles.push((parentDirectory ? parentDirectory + "/" : "") + filename);
			}
		}

		return compressedFiles;
	}

	public static getCodeAnalysis(filepath: string): TSFileStructure {
		return AnalyzeTSFile.analyzeTSFile(filepath);
	}

	public static listCodeAnalysis(filepath: string): object {
		return AnalyzeTSFile.compressTSFileStructure(AnalyzeTSFile.analyzeTSFile(filepath));
	}
}
