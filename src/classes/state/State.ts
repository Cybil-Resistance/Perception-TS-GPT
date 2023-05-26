import { RequestMessage } from "@src/classes/request/RequestMessage";

export default class State {
	private requestMessage: RequestMessage;
	private programState: { [program: string]: { [key: string]: any } };

	constructor() {
		this.requestMessage = new RequestMessage();
		this.programState = {};
	}

	serialize(): string {
		return JSON.stringify({
			requestMessage: this.requestMessage,
		});
	}

	deserialize(serialized: string): void {
		const data = JSON.parse(serialized);

		this.requestMessage = data.requestMessage;
	}

	getRequestMessage(): RequestMessage {
		return this.requestMessage;
	}

	getProgramState(program: string): { [key: string]: any } {
		return this.programState[program] || {};
	}

	setProgramState(program: string, state: { [key: string]: any }): void {
		if (!(program in this.programState)) {
			this.programState[program] = {};
		}

		this.programState[program] = { ...this.programState[program], ...state };
	}
}
