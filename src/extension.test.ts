import { describe, expect, it, vi } from "vitest";

import {
  TasksTreeItem,
  buildShellCommand,
  getStatusIcon,
  resolveTask,
} from "./helpers";
import { type IsItReadyTask } from "./types";

vi.mock("vscode", () => {
  class EventEmitter<T> {
    private listeners: ((value: T) => void)[] = [];
    event = (listener: (value: T) => void) => {
      this.listeners.push(listener);
    };
    fire(value?: T) {
      for (const listener of this.listeners) {
        listener(value as T);
      }
    }
  }

  class TreeItem {
    label: string;
    collapsibleState: number;
    description?: string;
    tooltip?: string;
    contextValue?: string;
    iconPath?: unknown;
    command?: unknown;

    constructor(label: string, collapsibleState: number) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  }

  class ThemeColor {
    id: string;
    constructor(id: string) {
      this.id = id;
    }
  }

  class ThemeIcon {
    id: string;
    color?: ThemeColor;
    constructor(id: string, color?: ThemeColor) {
      this.id = id;
      this.color = color;
    }
  }

  return {
    EventEmitter,
    ThemeColor,
    ThemeIcon,
    TreeItem,
    TreeItemCollapsibleState: {
      None: 0,
    },
    RelativePattern: class {},
    commands: {},
    env: { shell: "/bin/bash" },
    window: {
      createOutputChannel: vi.fn(() => {
        return {
          append: vi.fn(),
          appendLine: vi.fn(),
          show: vi.fn(),
        };
      }),
      showWarningMessage: vi.fn(),
    },
    workspace: {
      workspaceFolders: [],
      createFileSystemWatcher: vi.fn(() => {
        return {
          onDidCreate: vi.fn(),
          onDidChange: vi.fn(),
          onDidDelete: vi.fn(),
        };
      }),
    },
  };
});

describe("extension helpers", () => {
  it("buildShellCommand uses login shell for bash and zsh", () => {
    const bashResult = buildShellCommand("/bin/bash", "echo test");
    const zshResult = buildShellCommand("/bin/zsh", "echo test");

    expect(bashResult.shell).toBe("/bin/bash");
    expect(bashResult.args[0]).toBe("-lic");
    expect(zshResult.shell).toBe("/bin/zsh");
    expect(zshResult.args[0]).toBe("-lic");
  });

  it("buildShellCommand uses -c for other shells", () => {
    const result = buildShellCommand("/usr/bin/fish", "echo test");
    expect(result.args[0]).toBe("-c");
  });

  it("getStatusIcon returns themed icons", () => {
    const passed = getStatusIcon("passed") as { id?: string; color?: unknown };
    const failed = getStatusIcon("failed") as { id?: string; color?: unknown };
    const running = getStatusIcon("running") as { id?: string };
    const idle = getStatusIcon("idle") as { id?: string };

    expect(passed.id).toBe("check");
    expect(failed.id).toBe("error");
    expect(running.id).toBe("sync~spin");
    expect(idle.id).toBe("circle-outline");
  });

  it("resolveTask returns undefined for invalid inputs", () => {
    expect(resolveTask()).toBeUndefined();
    expect(resolveTask({} as IsItReadyTask)).toBeUndefined();
  });

  it("resolveTask returns task for plain object", () => {
    const task: IsItReadyTask = { tool: "ESLint", command: "npm run lint" };
    expect(resolveTask(task)).toEqual(task);
  });

  it("resolveTask returns task from tree item", () => {
    const task: IsItReadyTask = { tool: "Knip", command: "npm run knip" };
    const item = new TasksTreeItem(task, "idle");
    expect(resolveTask(item)).toEqual(task);
  });

  it("TasksTreeItem sets context and command", () => {
    const task: IsItReadyTask = {
      tool: "Prettier",
      command: "npm run prettier",
    };
    const item = new TasksTreeItem(task, "idle");

    expect(item.contextValue).toBe("is-it-ready.task");
    expect(item.command).toEqual({
      command: "is-it-ready.openTaskOutput",
      title: "Open Task Output",
      arguments: [task],
    });
  });

  it("TasksTreeItem marks fix tasks", () => {
    const task: IsItReadyTask = {
      tool: "ESLint",
      command: "npm run lint",
      fixCommand: "npm run lint:fix",
    };
    const item = new TasksTreeItem(task, "idle");
    expect(item.contextValue).toBe("is-it-ready.task.fix");
  });
});
