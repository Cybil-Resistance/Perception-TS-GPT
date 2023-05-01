export type OperationFormat = {
	disabled?: boolean;
	method: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	call: (...args: any[]) => any;
	args: {
		key: string;
		type: string;
		optional?: boolean;
	}[];
};

export default class BaseOperation {
	public static getName(): string {
		return "";
	}

	public static getDescription(): string {
		return "";
	}

	public static getOperations(): OperationFormat[] {
		return [];
	}
}
