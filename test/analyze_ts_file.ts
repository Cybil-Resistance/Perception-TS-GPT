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

		//console.log(JSON.stringify(structure.types));

		expect(structure.types).to.deep.equal([
			{
				name: "TSVariable",
				properties: [
					{ name: "name", type: "string", exported: false },
					{ name: "type", type: "string", exported: false },
					{ name: "exported", type: "boolean", exported: false },
				],
				methods: [],
				exported: true,
			},
			{
				name: "TSFunction",
				properties: [
					{ name: "name", type: "string", exported: false },
					{ name: "inputs", type: "TSVariable[]", exported: false },
					{ name: "output", type: "string", exported: false },
					{ name: "visibility", type: '"public" | "private" | "protected"', exported: false },
					{ name: "exported", type: "boolean", exported: false },
				],
				methods: [],
				exported: true,
			},
			{
				name: "TSInterface",
				properties: [
					{ name: "name", type: "string", exported: false },
					{ name: "properties", type: "TSVariable[]", exported: false },
					{ name: "methods", type: "TSFunction[]", exported: false },
					{ name: "exported", type: "boolean", exported: false },
				],
				methods: [],
				exported: true,
			},
			{ name: "TSType", properties: [], methods: [], exported: true },
			{ name: "TSClass", properties: [], methods: [], exported: true },
			{
				name: "TSFileStructure",
				properties: [
					{ name: "types", type: "TSType[]", exported: false },
					{ name: "classes", type: "TSClass[]", exported: false },
					{ name: "functions", type: "TSFunction[]", exported: false },
					{ name: "variables", type: "TSVariable[]", exported: false },
					{ name: "interfaces", type: "TSInterface[]", exported: false },
				],
				methods: [],
				exported: true,
			},
		]);

		//console.log(JSON.stringify(structure.classes));

		expect(structure.classes).to.deep.equal([
			{
				name: "AnalyzeTSFile",
				properties: [],
				methods: [
					{ name: "getName", inputs: [], output: "string", visibility: "public", exported: false },
					{ name: "getDescription", inputs: [], output: "string", visibility: "public", exported: false },
					{ name: "getOperations", inputs: [], output: "OperationFormat[]", visibility: "public", exported: false },
					{
						name: "analyzeTSFile",
						inputs: [{ name: "tsFilepath", type: "string", exported: false }],
						output: "TSFileStructure",
						visibility: "public",
						exported: false,
					},
					{
						name: "processNode",
						inputs: [
							{ name: "fileStructure", type: "TSFileStructure", exported: false },
							{ name: "node", type: "ts.Node", exported: false },
						],
						output: "void",
						visibility: "private",
						exported: false,
					},
					{
						name: "isExport",
						inputs: [{ name: "node", type: "ts.Node", exported: false }],
						output: "boolean",
						visibility: "private",
						exported: false,
					},
					{
						name: "getVariableStructure",
						inputs: [
							{
								name: "node",
								type: "ts.VariableDeclaration | ts.ParameterDeclaration | ts.PropertyDeclaration | ts.PropertySignature",
								exported: false,
							},
						],
						output: "TSVariable",
						visibility: "private",
						exported: false,
					},
					{
						name: "printFunction",
						inputs: [
							{ name: "childNode", type: "ts.MethodDeclaration | ts.FunctionDeclaration", exported: false },
							{ name: "outputType", type: "string", exported: false },
						],
						output: "string",
						visibility: "private",
						exported: false,
					},
					{
						name: "getMethodStructure",
						inputs: [{ name: "childNode", type: "ts.MethodDeclaration | ts.FunctionDeclaration", exported: false }],
						output: "TSFunction",
						visibility: "private",
						exported: false,
					},
					{
						name: "getInterfaceStructure",
						inputs: [
							{
								name: "node",
								type: "ts.InterfaceDeclaration | ts.ClassDeclaration | ts.TypeAliasDeclaration",
								exported: false,
							},
						],
						output: "TSInterface",
						visibility: "private",
						exported: false,
					},
				],
				exported: true,
			},
		]);
	});
});
