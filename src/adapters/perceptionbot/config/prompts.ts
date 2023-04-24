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

Keep all comments within the code.

Do not provide any context or explanation, only provide the code.

"""
{{CODE}}
"""`;

export const CREATE_TEST_OPERATION = `Using the following code, create a new mocha test that covers the functions within the code.

Do not provide any context or explanation, only provide the code.

The following is the reference code for the test:

"""
{{CODE}}
"""

Use the following template to create the test:

"""
import { expect } from "chai";

import OPERATION from "@src/operations/OPERATION";

describe("Operations: OPERATION_DESCRIPTION", function () {
	TESTS GO HERE
});
"""
`;

export const EDIT_TEST_OPERATION = `Using the following mocha test framework code, update the test so that it covers the functions within the code.

Do not provide any context or explanation, only provide the code.

The following is the reference code for the test:

"""
{{CODE}}
"""

Modify the following existing test code:

"""
{{TEST_CODE}}
"""
`;
