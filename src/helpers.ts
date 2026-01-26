import { execFile, spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import {
  EventEmitter,
  type OutputChannel,
  ThemeColor,
  ThemeIcon,
  type TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  type WorkspaceFolder,
  env,
  window,
  workspace,
} from "vscode";

import {
  type IsItReadyConfig,
  type IsItReadyTask,
  type TaskStatus,
} from "./types";

export class TasksTreeItem extends TreeItem {
  readonly task: IsItReadyTask;

  constructor(task: IsItReadyTask, status: TaskStatus) {
    super(task.tool, TreeItemCollapsibleState.None);
    this.task = task;
    this.description = task.command;
    this.tooltip = `${task.tool}\n${task.command}\nStatus: ${status}`;
    this.contextValue = task.fixCommand
      ? "is-it-ready.task.fix"
      : "is-it-ready.task";
    this.iconPath = getStatusIcon(status);
    this.command = {
      command: "is-it-ready.openTaskOutput",
      title: "Open Task Output",
      arguments: [task],
    };
  }
}

export class TasksTreeDataProvider implements TreeDataProvider<TasksTreeItem> {
  private readonly onDidChangeTreeDataEmitter = new EventEmitter<
    TasksTreeItem | undefined | void
  >();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private tasks: IsItReadyTask[] = [];
  private readonly statusByTool = new Map<string, TaskStatus>();

  async refresh() {
    await this.loadTasks();
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: TasksTreeItem): TreeItem {
    return element;
  }

  async getChildren(): Promise<TasksTreeItem[]> {
    if (this.tasks.length === 0) {
      await this.loadTasks();
    }

    return this.tasks.map((task) => {
      const status = this.statusByTool.get(task.tool) ?? "idle";
      return new TasksTreeItem(task, status);
    });
  }

  getTaskByTool(tool: string): IsItReadyTask | undefined {
    return this.tasks.find((task) => {
      return task.tool === tool;
    });
  }

  setStatus(tool: string, status: TaskStatus) {
    this.statusByTool.set(tool, status);
    this.onDidChangeTreeDataEmitter.fire();
  }

  clearMissingStatuses() {
    const toolSet = new Set(
      this.tasks.map((task) => {
        return task.tool;
      })
    );
    for (const key of this.statusByTool.keys()) {
      if (!toolSet.has(key)) {
        this.statusByTool.delete(key);
      }
    }
  }

  private async loadTasks(): Promise<IsItReadyTask[]> {
    const workspaceFolder = workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      this.tasks = [];
      this.clearMissingStatuses();
      return [];
    }

    const configPath = path.join(
      workspaceFolder.uri.fsPath,
      ".is-it-ready.config.mjs"
    );

    try {
      await fs.access(configPath);
    } catch {
      this.tasks = [];
      this.clearMissingStatuses();
      return [];
    }

    const configUrl = pathToFileURL(configPath);
    configUrl.searchParams.set("t", Date.now().toString());

    try {
      const configModule = (await import(configUrl.href)) as {
        default?: IsItReadyConfig;
      };
      const tasks = configModule.default?.tasks ?? [];
      this.tasks = tasks.filter((task): task is IsItReadyTask => {
        return Boolean(task.tool && task.command);
      });
      this.clearMissingStatuses();
      return this.tasks;
    } catch (error) {
      console.error("Failed to load .is-it-ready.config.mjs", error);
      this.tasks = [];
      this.clearMissingStatuses();
      return [];
    }
  }
}

/**
 * Get the icon for the given task status.
 *
 * @param {TaskStatus} status - The status of the task.
 * @returns {ThemeIcon} - The corresponding icon.
 */
export function getStatusIcon(status: TaskStatus): ThemeIcon {
  switch (status) {
    case "running":
      return new ThemeIcon("sync~spin");
    case "passed":
      return new ThemeIcon("check", new ThemeColor("testing.iconPassed"));
    case "failed":
      return new ThemeIcon("error", new ThemeColor("testing.iconFailed"));
    default:
      return new ThemeIcon("circle-outline");
  }
}

/**
 * Get the first workspace folder.
 *
 * @returns {WorkspaceFolder | undefined} - The first workspace folder or undefined if none exists.
 */
export function getWorkspaceFolder(): WorkspaceFolder | undefined {
  return workspace.workspaceFolders?.[0];
}

/**
 * Create an output channel for logging.
 *
 * @param {string} name - The name of the output channel.
 * @returns {OutputChannel} - The created output channel.
 */
export function createOutputChannel(name: string): OutputChannel {
  return window.createOutputChannel(name);
}

/**
 * Run a command in a given working directory and log output to the provided output channel.
 *
 * @param {string} command - The command to run.
 * @param {string} cwd - The working directory to run the command in.
 * @returns {Promise<number>} - A promise that resolves to the command's exit code.
 */
async function runCommand(
  command: string,
  cwd: string
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const shellPath = env.shell || process.env.SHELL || "/bin/sh";
    const { shell, args } = buildShellCommand(shellPath, command);
    void resolveShellEnvironment(shellPath).then((env) => {
      const child = spawn(shell, args, {
        cwd,
        env,
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout.on("data", (data: Buffer) => {
        stdoutChunks.push(data);
      });
      child.stderr.on("data", (data: Buffer) => {
        stderrChunks.push(data);
      });

      child.on("error", (error) => {
        resolve({
          exitCode: 1,
          stdout: "",
          stderr: `Command failed to start: ${error.message}`,
        });
      });

      child.on("close", (code) => {
        resolve({
          exitCode: code ?? 1,
          stdout: Buffer.concat(stdoutChunks).toString(),
          stderr: Buffer.concat(stderrChunks).toString(),
        });
      });
    });
  });
}

/**
 * Build the shell command and arguments based on the platform.
 *
 * @param {string} shellPath - The path to the shell executable.
 * @param {string} command - The command to run.
 * @returns {{shell: string, args: string[]}} - The shell and its arguments.
 */
export function buildShellCommand(shellPath: string, command: string) {
  if (process.platform === "win32") {
    const shellLower = shellPath.toLowerCase();
    if (shellLower.includes("powershell") || shellLower.includes("pwsh")) {
      return {
        shell: shellPath,
        args: ["-NoProfile", "-Command", command],
      };
    }
    return {
      shell: shellPath,
      args: ["/d", "/s", "/c", command],
    };
  }

  const shellName = path.basename(shellPath);
  const loginFlag = shellName === "bash" || shellName === "zsh" ? "-lic" : "-c";
  return {
    shell: shellPath,
    args: [loginFlag, command],
  };
}

let cachedShellEnv: NodeJS.ProcessEnv | null = null;
let cachedShellPath: string | null = null;

/**
 * Resolve the shell environment for the given shell path.
 *
 * @param {string} shellPath - The path to the shell executable.
 * @returns {Promise<NodeJS.ProcessEnv>} - The resolved shell environment.
 */
async function resolveShellEnvironment(
  shellPath: string
): Promise<NodeJS.ProcessEnv> {
  if (cachedShellEnv && cachedShellPath === shellPath) {
    return cachedShellEnv;
  }

  const shellPathValue = await getShellPathFromLoginShell(shellPath);
  if (shellPathValue) {
    cachedShellEnv = {
      ...process.env,
      PATH: shellPathValue,
    };
  } else {
    cachedShellEnv = { ...process.env };
  }
  cachedShellPath = shellPath;
  return cachedShellEnv;
}

/**
 * Get the PATH from the login shell.
 *
 * @param {string} shellPath - The path to the shell executable.
 * @returns {Promise<string | undefined>} - The PATH from the login shell or undefined if not available.
 */
function getShellPathFromLoginShell(
  shellPath: string
): Promise<string | undefined> {
  if (process.platform === "win32") {
    return Promise.resolve(undefined);
  }

  const { shell, args } = buildShellCommand(shellPath, 'printf "%s" "$PATH"');

  return new Promise((resolve) => {
    execFile(shell, args, { env: process.env }, (error, stdout) => {
      if (error) {
        resolve(undefined);
        return;
      }
      const output = stdout.toString().trim();
      resolve(output.length > 0 ? output : undefined);
    });
  });
}

/**
 * Run a task and log output to the provided output channel.
 *
 * @param {OutputChannel} outputChannel - The output channel to log task output.
 * @param {WorkspaceFolder} workspaceFolder - The workspace folder in which to run the task.
 * @param {IsItReadyTask} task - The task to run.
 * @param {string} [commandOverride] - Optional command to override the task's default command.
 * @returns {Promise<number>} - A promise that resolves to the task's exit code.
 */
export async function runTaskInternal(
  outputChannel: OutputChannel,
  workspaceFolder: WorkspaceFolder,
  task: IsItReadyTask,
  commandOverride?: string
): Promise<number> {
  const command = commandOverride ?? task.command;
  outputChannel.clear();
  outputChannel.show(true);

  const { exitCode, stdout, stderr } = await runCommand(
    command,
    workspaceFolder.uri.fsPath
  );

  const trimmedStderr = stderr.trim();
  const trimmedStdout = stdout.trim();

  if (exitCode === 0 && trimmedStderr.length === 0) {
    outputChannel.appendLine(`✓ ${task.tool} succeeded`);
    return exitCode;
  }

  if (trimmedStderr.length > 0) {
    outputChannel.appendLine(trimmedStderr);
    return exitCode;
  }

  if (trimmedStdout.length > 0) {
    outputChannel.appendLine(trimmedStdout);
    return exitCode;
  }

  outputChannel.appendLine(
    exitCode === 0
      ? `✓ ${task.tool} succeeded`
      : `${task.tool} failed with exit code ${exitCode}`
  );
  return exitCode;
}

/**
 * Resolve the task from the input which can be either a task or a tree item.
 *
 * @param {IsItReadyTask | TasksTreeItem | undefined} input - The input to resolve.
 * @returns {IsItReadyTask | undefined} - The resolved task or undefined if not resolvable.
 */
export function resolveTask(
  input?: IsItReadyTask | TasksTreeItem
): IsItReadyTask | undefined {
  if (!input) {
    return undefined;
  }

  if (input instanceof TasksTreeItem) {
    return input.task;
  }

  if ("tool" in input && "command" in input) {
    return input;
  }

  return undefined;
}
