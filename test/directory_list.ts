import { expect } from "chai";
import DirectoryList from "@src/operations/directory_list";
import fs from "fs";
import path from "path";

describe("Operations: List Directories", function () {
	before(function () {
		const folderPath = path.join(__dirname, "../tmp/test/folder1/folder2/folder3/folder4");
		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath, { recursive: true });
			fs.writeFileSync(path.join(folderPath, "test4.txt"), "test4");
		}
		const filePath = path.join(__dirname, "../tmp/test/test.txt");
		if (!fs.existsSync(filePath)) {
			fs.writeFileSync(filePath, "test");
		}
		const filePath2 = path.join(__dirname, "../tmp/test/folder1/test2.txt");
		if (!fs.existsSync(filePath2)) {
			fs.writeFileSync(filePath2, "test2");
		}
		const filePath3 = path.join(__dirname, "../tmp/test/folder1/folder2/test3.txt");
		if (!fs.existsSync(filePath3)) {
			fs.writeFileSync(filePath3, "test3");
		}
	});

	it("should return a JSON structure that mimics the folder-file structure", async function () {
		const result = await DirectoryList.run("./tmp/test");
		expect(result).to.deep.equal({
			"test.txt": {
				type: "file",
				filetype: "txt",
			},
			folder1: {},
		});
	});

	it("should throw an error if the path is not a directory", async function () {
		try {
			await DirectoryList.run("./tmp/test/test.txt");
		} catch (error) {
			expect(error.message).to.equal("Path is not a directory.");
		}
	});

	it("should recursively navigate down the tree if deepRecursive is true", async function () {
		const result = await DirectoryList.run("./tmp/test", true);
		expect(result).to.deep.equal({
			"test.txt": {
				type: "file",
				filetype: "txt",
			},
			folder1: {
				"test2.txt": {
					type: "file",
					filetype: "txt",
				},
				folder2: {
					"test3.txt": {
						type: "file",
						filetype: "txt",
					},
					folder3: {
						folder4: {
							"test4.txt": {
								type: "file",
								filetype: "txt",
							},
						},
					},
				},
			},
		});
	});

	it("should flatten the JSON structure if flatten is true and recursive is false", async function () {
		const result = await DirectoryList.run("./tmp/test", false, true);
		expect(result).to.deep.equal(["folder1", "test.txt"]);
	});

	it("should flatten the JSON structure if flatten is true and recursive is true", async function () {
		const result = await DirectoryList.run("./tmp/test", true, true);
		expect(result).to.deep.equal([
			"folder1",
			"folder1/folder2",
			"folder1/folder2/folder3",
			"folder1/folder2/folder3/folder4",
			"folder1/folder2/folder3/folder4/test4.txt",
			"folder1/folder2/test3.txt",
			"folder1/test2.txt",
			"test.txt",
		]);
	});

	after(function () {
		// Remove all test folders and files
		fs.rmSync(path.join(process.cwd() + "/tmp/test"), { recursive: true });
	});
});
