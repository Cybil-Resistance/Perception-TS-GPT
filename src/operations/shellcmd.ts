/**
 * Operation Prompt: Execute a shell command and capture the output and errors.
 **/

export default class ShellCommand {
	public static getName(): string {
		return "Execute Shell Command";
	}

	public static getDescription(): string {
		return "Executes an arbitrary shell command that is passed in as an argument, and captures the output and errors to return.";
	}

	public static async run(command: string): Promise<{ stdout: string, stderr: string }> {
		const util = require('util');
		const exec = util.promisify(require('child_process').exec);

		try {
			const { stdout, stderr } = await exec(command);
			return { stdout, stderr };
		} catch (error) {
			return { stdout: '', stderr: error.message };
		}
	}
}