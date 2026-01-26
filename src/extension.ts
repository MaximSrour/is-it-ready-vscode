import {
  type ExtensionContext,
  RelativePattern,
  commands,
  window,
  workspace,
} from "vscode";

import {
  TasksTreeDataProvider,
  type TasksTreeItem,
  createOutputChannel,
  getWorkspaceFolder,
  resolveTask,
  runTaskInternal,
} from "./helpers";
import { type IsItReadyTask } from "./types";

/**
 * Activate the extension.
 *
 * @param {ExtensionContext} context - The extension context.
 */
export function activate(context: ExtensionContext) {
  const tasksProvider = new TasksTreeDataProvider();
  const outputChannels = new Map<
    string,
    ReturnType<typeof createOutputChannel>
  >();

  const getOutputChannelForTask = (tool: string) => {
    const existing = outputChannels.get(tool);
    if (existing) {
      return existing;
    }
    const channel = createOutputChannel(`Is It Ready: ${tool}`);
    outputChannels.set(tool, channel);
    context.subscriptions.push(channel);
    return channel;
  };

  context.subscriptions.push(
    window.registerTreeDataProvider("is-it-ready.tasks", tasksProvider)
  );

  context.subscriptions.push(
    commands.registerCommand("is-it-ready.refreshTasks", async () => {
      await tasksProvider.refresh();
    })
  );

  context.subscriptions.push(
    commands.registerCommand(
      "is-it-ready.runTask",
      async (taskInput?: IsItReadyTask | TasksTreeItem) => {
        const workspaceFolder = getWorkspaceFolder();
        if (!workspaceFolder) {
          window.showWarningMessage("Open a workspace to run tasks.");
          return;
        }

        const task = resolveTask(taskInput);
        if (!task?.command) {
          window.showWarningMessage("No task selected.");
          return;
        }

        tasksProvider.setStatus(task.tool, "running");
        const outputChannel = getOutputChannelForTask(task.tool);
        const exitCode = await runTaskInternal(
          outputChannel,
          workspaceFolder,
          task
        );
        const status = exitCode === 0 ? "passed" : "failed";
        tasksProvider.setStatus(task.tool, status);
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "is-it-ready.fixTask",
      async (taskInput?: IsItReadyTask | TasksTreeItem) => {
        const workspaceFolder = getWorkspaceFolder();
        if (!workspaceFolder) {
          window.showWarningMessage("Open a workspace to run tasks.");
          return;
        }

        const task = resolveTask(taskInput);
        if (!task?.fixCommand) {
          window.showWarningMessage("This task has no fix command.");
          return;
        }

        tasksProvider.setStatus(task.tool, "running");
        const outputChannel = getOutputChannelForTask(task.tool);
        const exitCode = await runTaskInternal(
          outputChannel,
          workspaceFolder,
          task,
          task.fixCommand
        );
        const status = exitCode === 0 ? "passed" : "failed";
        tasksProvider.setStatus(task.tool, status);
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand("is-it-ready.runAllTasks", async () => {
      const workspaceFolder = getWorkspaceFolder();
      if (!workspaceFolder) {
        window.showWarningMessage("Open a workspace to run tasks.");
        return;
      }

      await tasksProvider.refresh();
      const tasks = await tasksProvider.getChildren();

      await Promise.all(
        tasks.map(async (item) => {
          tasksProvider.setStatus(item.task.tool, "running");
          const outputChannel = getOutputChannelForTask(item.task.tool);
          const exitCode = await runTaskInternal(
            outputChannel,
            workspaceFolder,
            item.task
          );
          const status = exitCode === 0 ? "passed" : "failed";
          tasksProvider.setStatus(item.task.tool, status);
        })
      );
    })
  );

  context.subscriptions.push(
    commands.registerCommand(
      "is-it-ready.openTaskOutput",
      (taskInput?: IsItReadyTask | TasksTreeItem) => {
        const task = resolveTask(taskInput);
        if (!task?.tool) {
          window.showWarningMessage("No task selected.");
          return;
        }
        const outputChannel = getOutputChannelForTask(task.tool);
        outputChannel.show(true);
      }
    )
  );

  const workspaceFolder = getWorkspaceFolder();
  if (workspaceFolder) {
    const watcher = workspace.createFileSystemWatcher(
      new RelativePattern(workspaceFolder, ".is-it-ready.config.mjs")
    );
    watcher.onDidCreate(() => {
      return void tasksProvider.refresh();
    });
    watcher.onDidChange(() => {
      return void tasksProvider.refresh();
    });
    watcher.onDidDelete(() => {
      return void tasksProvider.refresh();
    });
    context.subscriptions.push(watcher);
  }
}

/**
 * Deactivate the extension.
 */
export function deactivate() {
  // No-op
}
