import { expect } from "chai";
import ShellCommand from "@src/operations/shellcmd";

describe("Operations: Execute Shell Command", function () {
  it("should return stdout and stderr when given a valid command", async function () {
    const command = "echo 'Hello, world!'";
    const { stdout, stderr } = await ShellCommand.run(command);
    expect(stdout).to.equal("Hello, world!\n");
    expect(stderr).to.equal("");
  });

  it("should return an empty string for stdout and an error message for stderr when given an invalid command", async function () {
    const command = "thisisnotavalidcommand";
    const { stdout, stderr } = await ShellCommand.run(command);
    expect(stdout).to.equal("");
    expect(stderr).to.include("not found");
  });
});
