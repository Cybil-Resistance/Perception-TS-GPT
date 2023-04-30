import BaseOperation, { OperationFormat } from "./base_operation";

export default class DoNothing extends BaseOperation {
	public static getName(): string {
		return "Do Nothing";
	}

	public static getDescription(): string {
		return "Do nothing.";
	}

	public static getOperations(): OperationFormat[] {
		return [
			{
				method: "do_nothing",
				call: this.run,
				args: [],
			},
		];
	}

	public static run(): void {
		return;
	}
}
