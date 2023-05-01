import BaseOperation, { OperationFormat } from "./base_operation";
import util from "util";
import child_process from "child_process";

/**
 * Operation Prompt: Execute a shell command and capture the output and errors.
 **/

export default class ShellCommand extends BaseOperation {
	public static getName(): string {
		return "Execute Shell Command";
	}

	public static getDescription(): string {
		return "Execute an arbitrary shell command.";
	}

	public static getOperations(): OperationFormat[] {
		return [
			{
				disabled: true,
				method: "execute_shell_command",
				call: this.run,
				args: [
					{
						key: "command",
						type: "string",
					},
				],
			},
		];
	}

	public static async run(command: string): Promise<{ stdout: string; stderr: string }> {
		const exec = util.promisify(child_process.exec);

		try {
			const { stdout, stderr } = await exec(command);
			return { stdout, stderr };
		} catch (error) {
			return { stdout: "", stderr: error.message };
		}
	}
}
