export const FILE_LIST = `The program has the following files and folders:
{{FILE_LIST}}`;

export const FILE_STRUCTURE = `The file, {{FILE_PATH}}, has the following types, classes, functions, and interfaces:
{{FILE_STRUCTURE}}`;

export const FILE_CONTENTS = `The file, {{FILE_PATH}}, has the following contents:
"""
{{FILE_CONTENTS}}
"""`;

export const CREATE_OPERATION = `Create a new file that meets the following criteria: {{DETAILS}}

Do not provide any context or explanation, only provide the code.

Do not add any text before the code. Do not add any text after the code. Only provide the code.`;

export const EDIT_OPERATION = `Using the following code, modify it so that it meets the following requirements: {{EDITS}}

Do not provide any context or explanation, only provide the code.

Do not add any text before the code. Do not add any text after the code. Only provide the code.

"""
{{CODE}}
"""`;
