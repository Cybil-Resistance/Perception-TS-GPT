import DirectoryList from "./directory_list";
import FileRead from "./file_read";
import FileWrite from "./file_write";
import Git from "./git";
import Google from "./google";
import NpmHelper from "./npm_helper";
import Selenium from "./selenium";
import ShellCommand from "./shellcmd";
import DoNothing from "./do_nothing";
import TaskComplete from "./task_complete";

export const Operations = [DirectoryList, FileRead, FileWrite, Git, Google, NpmHelper, Selenium, ShellCommand, DoNothing, TaskComplete];
export { DirectoryList, FileRead, FileWrite, Git, Google, NpmHelper, Selenium, ShellCommand, DoNothing, TaskComplete };

export const Commands = Operations.map((operation) => {
	return { [operation.getName()]: operation.getOperations() };
});
