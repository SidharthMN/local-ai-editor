export type AgentActionType = "thought" | "write_file" | "read_file" | "execute_shell";

export interface AgentStep {
  id: string;
  action: AgentActionType;
  text?: string;
  path?: string;
  content?: string;
  command?: string;
  status: "idle" | "running" | "completed" | "failed" | "pending_approval";
  approved?: boolean;
}

export type SecurityMode = "strict" | "sandbox" | "yolo";

export interface VirtualFile {
  path: string;
  content: string;
}

export interface Workspace {
  [path: string]: string;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  source: "cloud-brain" | "local-executor" | "websocket" | "system";
  type: "info" | "success" | "warning" | "error" | "code";
  text: string;
  payload?: any;
}

export interface RateLimitStats {
  requestsThisMinute: number;
  maxRpm: number;
  totalRequests: number;
  backoffActive: boolean;
  backoffSecondsRemaining: number;
  retryCount: number;
}

export interface RenderState {
  status: "sleeping" | "waking" | "online";
  wakeupProgress: number; // 0 to 100
  timeUntilWakeup: number; // seconds
}
