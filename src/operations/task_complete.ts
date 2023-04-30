import BaseOperation, { OperationFormat } from "./base_operation";

export default class TaskComplete extends BaseOperation {
	public static getName(): string {
		return "Task Completed";
	}

	public static getDescription(): string {
		return "Complete the task.";
	}

	public static getOperations(): OperationFormat[] {
		return [
			{
				method: "task_complete",
				call: this.run,
				args: [
					{
						key: "reason",
						type: "string",
					},
				],
			},
		];
	}

	public static run(reason: string): void {
		console.log(`Task completed because ${reason}`);
		process.exit();
	}
}
