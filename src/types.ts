export type IsItReadyTask = {
  tool: string;
  command: string;
  fixCommand?: string;
};

export type IsItReadyConfig = {
  tasks?: IsItReadyTask[];
};

export type TaskStatus = "idle" | "running" | "passed" | "failed";
