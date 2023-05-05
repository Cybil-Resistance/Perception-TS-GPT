import { expect } from "chai";
import AnalyzeTSFile from "@src/operations/analyze_ts_file";

describe("Operations: Analyze TypeScript File", function () {
	it("should return the correct name", function () {
		expect(AnalyzeTSFile.getName()).to.equal("Analytze TypeScript File");
	});

	it("should return the correct description", function () {
		expect(AnalyzeTSFile.getDescription()).to.equal("Summarize Typescript file's public methods");
	});

	it("should return an empty array of operations", function () {
		expect(AnalyzeTSFile.getOperations()).to.deep.equal([]);
	});

	it("should log the correct node types and names", function () {
		const structure = AnalyzeTSFile.analyzeTSFile(process.cwd() + "/src/operations/analyze_ts_file.ts");

		expect(structure.types).to.deep.equal([
			{
				name: "TSVariable",
				properties: [
					{
						name: "name",
						type: "string",
					},
					{
						name: "type",
						type: "string",
					},
				],
				methods: [],
			},
			{
				name: "TSFunction",
				properties: [
					{
						name: "name",
						type: "string",
					},
					{
						name: "inputs",
						type: "TSVariable[]",
					},
					{
						name: "output",
						type: "string",
					},
					{
						name: "visibility",
						type: '"public" | "private" | "protected"',
					},
				],
				methods: [],
			},
			{
				name: "TSInterface",
				properties: [
					{
						name: "name",
						type: "string",
					},
					{
						name: "properties",
						type: "TSVariable[]",
					},
					{
						name: "methods",
						type: "TSFunction[]",
					},
				],
				methods: [],
			},
			{
				name: "TSType",
				properties: [],
				methods: [],
			},
			{
				name: "TSClass",
				properties: [],
				methods: [],
			},
			{
				name: "TSFileStructure",
				properties: [
					{
						name: "types",
						type: "TSType[]",
					},
					{
						name: "classes",
						type: "TSClass[]",
					},
					{
						name: "functions",
						type: "TSFunction[]",
					},
					{
						name: "variables",
						type: "TSVariable[]",
					},
					{
						name: "interfaces",
						type: "TSInterface[]",
					},
				],
				methods: [],
			},
		]);

		expect(structure.classes).to.deep.equal([
			{
				name: "AnalyzeTSFile",
				properties: [],
				methods: [
					{
						name: "getName",
						inputs: [],
						output: "string",
						visibility: "public",
					},
					{
						name: "getDescription",
						inputs: [],
						output: "string",
						visibility: "public",
					},
					{
						name: "getOperations",
						inputs: [],
						output: "OperationFormat[]",
						visibility: "public",
					},
					{
						name: "analyzeTSFile",
						inputs: [
							{
								name: "tsFilepath",
								type: "string",
							},
						],
						output: "TSFileStructure",
						visibility: "public",
					},
					{
						name: "processNode",
						inputs: [
							{
								name: "fileStructure",
								type: "TSFileStructure",
							},
							{
								name: "node",
								type: "ts.Node",
							},
						],
						output: "void",
						visibility: "private",
					},
					{
						name: "getVariableStructure",
						inputs: [
							{
								name: "node",
								type: "ts.VariableDeclaration | ts.ParameterDeclaration | ts.PropertyDeclaration | ts.PropertySignature",
							},
						],
						output: "TSVariable",
						visibility: "private",
					},
					{
						name: "getMethodStructure",
						inputs: [
							{
								name: "childNode",
								type: "ts.MethodDeclaration | ts.FunctionDeclaration",
							},
						],
						output: "TSFunction",
						visibility: "private",
					},
					{
						name: "getInterfaceStructure",
						inputs: [
							{
								name: "node",
								type: "ts.InterfaceDeclaration | ts.ClassDeclaration | ts.TypeAliasDeclaration",
							},
						],
						output: "TSInterface",
						visibility: "private",
					},
				],
			},
		]);
	});
});
