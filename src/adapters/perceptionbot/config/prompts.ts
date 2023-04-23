export const CREATE_OPERATION = `Using the following template, create a new class named {{CLASS_NAME}} that performs this operation: {{OPERATION}}

Update the operation name, description, run arguments, run return type, and the contents of run. Make sure that the operation name is normal English, with spaces, and that the description is a complete sentence.

Keep all comments within the code.

Do not provide any context or explanation, only provide the code.

"""
import { config as cfg } from "@src/config";

/**
 * Operation Prompt: {{OPERATION}}
 **/

export default class {{CLASS_NAME}} {
	public static getName(): string {
		return "NAME_OF_OPERATION";
	}

	public static getDescription(): string {
		return "DESCRIPTION_OF_OPERATION";
	}

	public static async run(ARGUMENTS): Promise<RETURN_TYPE> {

	}
}
"""`;

export const EDIT_OPERATION = `Using the following code, modify it so that it meets the following requirements: {{EDITS}}

Do not provide any context or explanation, only provide the code.

"""
{{CODE}}
"""`;
