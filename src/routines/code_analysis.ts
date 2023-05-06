import DirectoryList from "@src/operations/directory_list";
import AnalyzeTSFile from "@src/operations/analyze_ts_file";

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

	public static getCodeAnalysis(filepath: string): any {
		return AnalyzeTSFile.analyzeTSFile(filepath);
	}
}
