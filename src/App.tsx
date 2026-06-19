import React, { useState, useEffect, useRef } from "react";
import {
  AgentStep,
  Workspace,
  LogMessage,
  RateLimitStats,
  RenderState,
  SecurityMode,
} from "./types";
import { INITIAL_WORKSPACE } from "./initialWorkspace";
import DiffViewer from "./components/DiffViewer";
import FreeTierBossControls from "./components/FreeTierBossControls";
import ArchitectureDocs from "./components/ArchitectureDocs";
import {
  Terminal,
  Shield,
  Send,
  Sparkles,
  FileCode,
  FolderOpen,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Info,
  RefreshCw
} from "lucide-react";

export default function App() {
  // --- STATE DECLARATIONS ---
  const [workspace, setWorkspace] = useState<Workspace>(INITIAL_WORKSPACE);
  const [selectedFile, setSelectedFile] = useState<string>("index.html");
  const [editedCode, setEditedCode] = useState<string>(INITIAL_WORKSPACE["index.html"]);
  const [securityMode, setSecurityMode] = useState<SecurityMode>("strict");

  // State for Agent prompt input and current active run
  const [prompt, setPrompt] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [showDiffStep, setShowDiffStep] = useState<AgentStep | null>(null);

  // Status logs
  const [logs, setLogs] = useState<LogMessage[]>([
    {
      id: "init-log-1",
      timestamp: new Date().toLocaleTimeString(),
      source: "system",
      type: "info",
      text: "Local secure executor initialized. Listening on port 3000..."
    },
    {
      id: "init-log-2",
      timestamp: new Date().toLocaleTimeString(),
      source: "local-executor",
      type: "success",
      text: "Safety gate status: ACTIVE - Policy 'STRICT' enforced successfully."
    }
  ]);

  // Terminal emulation output
  const [terminalOutput, setTerminalOutput] = useState<string[]>(["local-executor-shell v1.3.4", "system ready."]);

  // Active workspace viewport simulator
  const [renderedUrl, setRenderedUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"workspace" | "logs" | "docs">("workspace");

  // Free Tier Boss Parameters State
  const [rateLimit, setRateLimit] = useState<RateLimitStats>({
    requestsThisMinute: 3,
    maxRpm: 10,
    totalRequests: 8,
    backoffActive: false,
    backoffSecondsRemaining: 0,
    retryCount: 0,
  });

  const [renderState, setRenderState] = useState<RenderState>({
    status: "online",
    wakeupProgress: 100,
    timeUntilWakeup: 0,
  });

  // Keep code view in sync when selecting different files
  useEffect(() => {
    setEditedCode(workspace[selectedFile] || "");
  }, [selectedFile, workspace]);

  // Sync internal viewport preview
  useEffect(() => {
    updateViewport();
  }, [workspace]);

  // Update virtual iframe simulator
  const updateViewport = () => {
    // Generate data URL of index.html
    const htmlContent = workspace["index.html"] || "<h1>No index.html</h1>";
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setRenderedUrl(url);
  };

  // State timers logic
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Backoff timer decrease
      setRateLimit((prev) => {
        if (prev.backoffActive && prev.backoffSecondsRemaining > 0) {
          const nextSec = prev.backoffSecondsRemaining - 0.2;
          if (nextSec <= 0) {
            addLog("websocket", "success", `Exponential backoff timeout expired. Gemini request lock released.`);
            return {
              ...prev,
              backoffActive: false,
              backoffSecondsRemaining: 0,
            };
          }
          return {
            ...prev,
            backoffSecondsRemaining: nextSec,
          };
        }
        // Naturally decay RPM count over time (simulate new minute resets)
        if (Math.random() < 0.15 && prev.requestsThisMinute > 0) {
          return {
            ...prev,
            requestsThisMinute: Math.max(0, prev.requestsThisMinute - 1)
          };
        }
        return prev;
      });

      // 2. Render wakeup timer decrease
      setRenderState((prev) => {
        if (prev.status === "waking" && prev.timeUntilWakeup > 0) {
          const nextSec = prev.timeUntilWakeup - 1;
          const progress = ((30 - nextSec) / 30) * 100;
          if (nextSec <= 0) {
            addLog("system", "success", "Render server cluster fully spun up. Establishing persistent WebSocket bridge...");
            return {
              status: "online",
              wakeupProgress: 100,
              timeUntilWakeup: 0,
            };
          }
          return {
            ...prev,
            timeUntilWakeup: nextSec,
            wakeupProgress: progress,
          };
        }
        return prev;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const addLog = (
    source: LogMessage["source"],
    type: LogMessage["type"],
    text: string,
    payload?: any
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        source,
        type,
        text,
        payload,
      },
    ]);
  };

  // Reset demo
  const resetWorkspace = () => {
    if (confirm("Reset local sandbox workspace back to initial template?")) {
      setWorkspace(INITIAL_WORKSPACE);
      setSelectedFile("index.html");
      setSteps([]);
      setCurrentStepIndex(-1);
      setShowDiffStep(null);
      setTerminalOutput(["local-executor-shell v1.3.4", "system ready.", "Workspace state reset."]);
      addLog("local-executor", "warning", "Workspace assets directory reset to default template layout.");
    }
  };

  // --- ACTIONS LOGIC ---

  // Handle client-side simulation when triggering prompts
  const triggerAgentPrompt = async () => {
    if (!prompt.trim()) return;

    // Check Render offline status
    if (renderState.status === "sleeping") {
      addLog("local-executor", "error", "Request failed: Cannot reach backend server. WebSocket is CLOSED (Render Server is Sleeping).");
      setTerminalOutput((prev) => [...prev, "err: connect ECONNREFUSED bin.render.internal"]);
      
      // Auto trigger waking process to provide great UX
      initiateRenderWakeup();
      return;
    }

    // Check rate limits and demonstrate exponential backoff
    if (rateLimit.requestsThisMinute >= rateLimit.maxRpm) {
      addLog("websocket", "warning", "RATE LIMIT EXCEEDED (429 Too Many Requests). Automatically initializing exponentially increasing backoff block...");
      setTerminalOutput((prev) => [...prev, `HTTP/1.1 429 Too Many Requests - RPM threshold [10] broken`]);
      const nextRetryCount = rateLimit.retryCount + 1;
      const backoffSec = Math.pow(2, nextRetryCount);
      setRateLimit((prev) => ({
        ...prev,
        backoffActive: true,
        backoffSecondsRemaining: backoffSec,
        retryCount: nextRetryCount,
      }));
      return;
    }

    setIsProcessing(true);
    addLog("system", "info", `Relaying client workflow bundle to cloud brain: "${prompt}"`);
    setTerminalOutput((prev) => [...prev, `curl -X POST /api/agent/prompt -H "Content-Type: application/json"`]);

    // Track RPM
    setRateLimit((prev) => ({
      ...prev,
      requestsThisMinute: prev.requestsThisMinute + 1,
      totalRequests: prev.totalRequests + 1,
    }));

    try {
      const response = await fetch("/api/agent/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, files: workspace }),
      });

      if (!response.ok) {
        throw new Error(`HTTP network error ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.plan) {
        addLog(
          "cloud-brain",
          data.isSimulated ? "warning" : "success",
          data.isSimulated 
            ? "Gemini API simulation deployed. Plan generated locally via procedural logic!"
            : "Succeed! Structured developer tool calling response parsed from live Gemini API.",
          data.plan
        );

        // Convert parsed JSON into steps with pending status
        const parsedSteps: AgentStep[] = data.plan.map((step: any, idx: number) => ({
          ...step,
          id: `step-${idx}-${Date.now()}`,
          status: idx === 0 ? "idle" : "idle",
        }));

        setSteps(parsedSteps);
        setCurrentStepIndex(0);
        
        // Start running the step sequence
        runStepIndex(0, parsedSteps);
      } else {
        throw new Error(data.error || "Malformed cloud brain payload response");
      }
    } catch (err: any) {
      console.error(err);
      addLog("cloud-brain", "error", `Cloud reasoning failed: ${err.message}`);
      setTerminalOutput((prev) => [...prev, `err: cloud dispatch - ${err.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run specific step in sequence
  const runStepIndex = async (index: number, currentList: AgentStep[]) => {
    if (index >= currentList.length) {
      addLog("system", "success", "Distributed workflow sequence completed. Local executor idle.");
      setCurrentStepIndex(-1);
      return;
    }

    setCurrentStepIndex(index);
    const step = currentList[index];
    
    // Update step status
    updateStepStatus(step.id, "running");

    // Check if step requires manual approval under active Security Gate policy
    const needsApproval = checkSecurityPolicyNeedsApproval(step);

    if (needsApproval) {
      addLog("local-executor", "warning", `Safety Gate Intercepted Action: '${step.action}' with target: '${step.path || step.command}'. Standing by for operator check...`);
      updateStepStatus(step.id, "pending_approval");
      setShowDiffStep(step);
      // Stop execution until approved
      return;
    }

    // Automatically execute the step
    await executeStepAction(step, index, currentList);
  };

  // Perform action on the local workspace state
  const executeStepAction = async (step: AgentStep, index: number, currentList: AgentStep[]) => {
    addLog("local-executor", "info", `Executing step ${index + 1}: [${step.action.toUpperCase()}]`);
    updateStepStatus(step.id, "running");

    // Simulating slight executor delays to make it visual and clear
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      if (step.action === "thought") {
        setTerminalOutput((prev) => [...prev, `brain-thought: ${step.text}`]);
      } 
      else if (step.action === "write_file" && step.path) {
        const oldContent = workspace[step.path] || "";
        setWorkspace((prev) => ({
          ...prev,
          [step.path!]: step.content || "",
        }));
        setSelectedFile(step.path);
        
        addLog("local-executor", "success", `Locally updated file path: '${step.path}' (${(step.content || "").length} bytes)`);
        setTerminalOutput((prev) => [
          ...prev,
          `cat << 'EOF' > ${step.path}`,
          ...(step.content ? step.content.split("\n").slice(0, 3) : []),
          `... (${(step.content || "").split("\n").length} more lines)`,
          `EOF`,
          `write_file ${step.path} [OK]`
        ]);
      } 
      else if (step.action === "read_file" && step.path) {
        const content = workspace[step.path];
        if (content === undefined) {
          throw new Error(`File '${step.path}' not found in virtual target space`);
        }
        setTerminalOutput((prev) => [...prev, `cat ${step.path}`, `read_file ${step.path} size: ${content.length} bytes [OK]`]);
      } 
      else if (step.action === "execute_shell" && step.command) {
        setTerminalOutput((prev) => [...prev, `$ ${step.command}`]);
        
        // Simulating actual shell command responses
        await new Promise((resolve) => setTimeout(resolve, 1200));
        
        if (step.command.includes("build")) {
          setTerminalOutput((prev) => [
            ...prev,
            "Compiling modules...",
            "Bundling complete. Static production build assets created successfully.",
            "✓ dist/index.html - 3.2kB",
            "Process exited safely with exit code 0"
          ]);
        } else if (step.command.includes("test")) {
          setTerminalOutput((prev) => [
            ...prev,
            "PASS  src/index.test.js",
            "✓ sandbox execution check (45ms)",
            "Test Suites: 1 passed, 1 total",
            "Tests:       1 passed, 1 total",
            "Snapshots:   0 total",
            "Time:        1.1s"
          ]);
        } else {
          setTerminalOutput((prev) => [...prev, "Execution complete.", "Exit code 0"]);
        }
      }

      // Mark completed
      updateStepStatus(step.id, "completed");
      
      // Advance to next step
      const updatedList = steps.map((s) => s.id === step.id ? { ...s, status: "completed" as const } : s);
      setSteps(updatedList);
      runStepIndex(index + 1, updatedList);

    } catch (err: any) {
      addLog("local-executor", "error", `Execution failed on step ${index + 1}: ${err.message}`);
      updateStepStatus(step.id, "failed");
      setTerminalOutput((prev) => [...prev, `err: execution failed - ${err.message}`]);
    }
  };

  // Approve a blocked step
  const approveCurrentStep = async () => {
    if (!showDiffStep || currentStepIndex === -1) return;

    const step = showDiffStep;
    setShowDiffStep(null);
    addLog("local-executor", "success", `Operator manual override: APPROVED action '${step.action}' against path '${step.path || ""}'`);
    
    // Execute
    await executeStepAction(step, currentStepIndex, steps);
  };

  // Reject/Abort a blocked sequence
  const rejectCurrentStep = () => {
    if (!showDiffStep) return;

    const step = showDiffStep;
    setShowDiffStep(null);
    addLog("local-executor", "error", `Operator manual override: REJECTED proposed action '${step.action}'. Sequence aborted.`);
    updateStepStatus(step.id, "failed");
    setTerminalOutput((prev) => [...prev, `execution aborted by user safety filter`]);
    setSteps([]);
    setCurrentStepIndex(-1);
  };

  // Helper safety policy validator
  const checkSecurityPolicyNeedsApproval = (step: AgentStep): boolean => {
    if (securityMode === "yolo") return false;
    
    // Strict mode blocks everything except theoretical "thought" actions
    if (securityMode === "strict") {
      return step.action !== "thought";
    }

    // Sandbox mode allows both thoughts and simple reading, but asks checks for shell commands or writes
    if (securityMode === "sandbox") {
      return step.action === "write_file" || step.action === "execute_shell";
    }

    return false;
  };

  const updateStepStatus = (id: string, status: AgentStep["status"]) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  // Simulated triggers
  const initiateRenderWakeup = () => {
    if (renderState.status === "waking" || renderState.status === "online") return;

    addLog("system", "warning", "Issued wake trigger. Polling non-blocking cloud server endpoint...");
    setTerminalOutput((prev) => [...prev, "HTTP/1.1 503 Service Unavailable (Initiating render-free cold wakeup cluster...)"]);
    
    setRenderState({
      status: "waking",
      wakeupProgress: 0,
      timeUntilWakeup: 30,
    });
  };

  const toggleRenderSleep = () => {
    if (renderState.status === "sleeping") {
      setRenderState({
        status: "online",
        wakeupProgress: 100,
        timeUntilWakeup: 0,
      });
      addLog("system", "success", "Simulated WebSocket linked. Server online.");
    } else {
      setRenderState({
        status: "sleeping",
        wakeupProgress: 0,
        timeUntilWakeup: 0,
      });
      addLog("system", "error", "Render server cluster spun down due to 15 minutes of inactivity. Pipeline severed.");
    }
  };

  const resetRateLimiter = () => {
    setRateLimit({
      requestsThisMinute: 0,
      maxRpm: 10,
      totalRequests: rateLimit.totalRequests,
      backoffActive: false,
      backoffSecondsRemaining: 0,
      retryCount: 0,
    });
    addLog("websocket", "success", "Rate limit simulator manually cleared. RPM count reset to 0.");
  };

  const handleEditorCodeSave = () => {
    setWorkspace((prev) => ({
      ...prev,
      [selectedFile]: editedCode,
    }));
    addLog("local-executor", "info", `Manually updated and saved changes to file: '${selectedFile}'`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* HEADER SECTION */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-sky-500 rounded-xl shadow-lg ring-1 ring-slate-700/50">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center">
              Cloud Brain & Local Executor Sandbox
            </h1>
            <p className="text-[10px] text-slate-400">
              Distributed Developer Agent Protocol Simulator & Runtime
            </p>
          </div>
        </div>

        {/* Global badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Security Indicator */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-xs">
            <span className="text-slate-500 font-mono text-[10px]">Gate:</span>
            <span
              className={`font-semibold capitalize text-[11px] ${
                securityMode === "strict"
                  ? "text-rose-400"
                  : securityMode === "sandbox"
                  ? "text-amber-400"
                  : "text-red-500 font-extrabold animate-pulse"
              }`}
            >
              {securityMode === "strict" ? "🔒 Strict" : securityMode === "sandbox" ? "🛡️ Sandbox" : "⚠️ YOLO Mode"}
            </span>
          </div>

          {/* Render Cluster Active State badge */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-xs">
            <span className="text-slate-500 font-mono text-[10px]">Brain:</span>
            <span
              className={`font-mono text-[11px] h-2 w-2 rounded-full ${
                renderState.status === "online"
                  ? "bg-emerald-400 animate-pulse"
                  : renderState.status === "waking"
                  ? "bg-amber-400"
                  : "bg-rose-400"
              }`}
            ></span>
            <span className="font-semibold text-slate-300 text-[11px]">
              {renderState.status === "online" ? "Connected" : renderState.status === "waking" ? "Waking..." : "Offline"}
            </span>
          </div>

          <button
            onClick={resetWorkspace}
            className="p-1 px-2.5 border border-slate-800 hover:bg-slate-800 bg-slate-950 text-slate-400 hover:text-white rounded-full text-[11px] transition flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset State
          </button>
        </div>
      </header>

      {/* CORE GRID CONTENT */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-6 h-full max-w-7xl mx-auto w-full">
        {/* LEFT COLUMN: THE CODE GENERATOR & TELEMETRY CONTROLS (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          
          {/* THE CLOUD LLM PROMPT CENTER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-sm text-slate-200">Simulate Cloud Prompt</h2>
              </div>
              <div className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                Gemini-3.5-Flash
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Input a natural language request. The Cloud Brain will parse it, architect discrete steps, and pipeline changes to your local virtual executor.
            </p>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setPrompt("Build me a sleek weather widget")}
                className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2.5 py-1 rounded-md text-slate-300 transition text-left cursor-pointer"
              >
                ☁️ Sleek Weather Widget
              </button>
              <button
                onClick={() => setPrompt("Create a premium custom tasks list")}
                className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2.5 py-1 rounded-md text-slate-300 transition text-left cursor-pointer"
              >
                📋 Task List Organizer
              </button>
              <button
                onClick={() => setPrompt("Build a modern interactive timer state")}
                className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-850 px-2.5 py-1 rounded-md text-slate-300 transition text-left cursor-pointer"
              >
                ⏱️ Interactive Timer
              </button>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask the Cloud Brain agent to build anything..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 placeholder:text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
              <button
                onClick={triggerAgentPrompt}
                disabled={isProcessing || !prompt.trim()}
                className="absolute right-2.5 bottom-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white p-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center space-x-1 shadow-lg shadow-indigo-950/40 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Deploy</span>
                  </>
                )}
              </button>
            </div>

            {/* PIPELINE EXECUTION PROGRESS FEED */}
            {steps.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center text-indigo-400">
                    <Terminal className="w-3.5 h-3.5 mr-1" />
                    Active Pipeline Pipeline
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {steps.filter((s) => s.status === "completed").length} / {steps.length} Steps
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {steps.map((step, idx) => {
                    const isCurrent = idx === steps.findIndex((s) => s.status === "running" || s.status === "pending_approval");
                    
                    return (
                      <div
                        key={step.id}
                        className={`p-2.5 border rounded-xl text-xs transition-all relative ${
                          step.status === "completed"
                            ? "bg-emerald-950/20 border-emerald-900/40 text-slate-300"
                            : step.status === "failed"
                            ? "bg-rose-950/20 border-rose-900/40 text-slate-400"
                            : step.status === "running"
                            ? "bg-indigo-950/25 border-indigo-500/50 text-white shadow-md shadow-indigo-950/10"
                            : step.status === "pending_approval"
                            ? "bg-amber-950/30 border-amber-500/60 text-white animate-pulse"
                            : "bg-slate-950/40 border-slate-850 text-slate-500"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 mr-2">
                              Step {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-300 capitalize text-xs">
                              {step.action.replace("_", " ")}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-1 font-mono">
                              {step.action === "thought" && step.text}
                              {step.action === "write_file" && `write → ${step.path}`}
                              {step.action === "read_file" && `read → ${step.path}`}
                              {step.action === "execute_shell" && `$ ${step.command}`}
                            </p>
                          </div>

                          <span className="text-[10px] font-mono font-medium">
                            {step.status === "completed" && <span className="text-emerald-400">Completed</span>}
                            {step.status === "failed" && <span className="text-rose-400">Failed</span>}
                            {step.status === "running" && <span className="text-indigo-400 animate-pulse">Running...</span>}
                            {step.status === "pending_approval" && <span className="text-amber-400 font-bold">Interrupted</span>}
                            {step.status === "idle" && <span className="text-slate-600">Pending</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FREE TIER CONTROL AND METRICS PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="font-bold text-sm text-slate-200 mb-4 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-sky-400" />
              Free Tier Cloud Telemetry Simulator
            </h2>

            <FreeTierBossControls
              rateLimit={rateLimit}
              renderState={renderState}
              onWakeup={initiateRenderWakeup}
              onToggleSleep={toggleRenderSleep}
              onResetRateLimiter={resetRateLimiter}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: REPLICATED DEVELOPER ENVIRONMENT (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          
          {/* SANDBOX SECURITY GATE POLICIES CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-0.5">
              <h3 className="font-bold text-xs text-slate-200 flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Active Local Safety Gate Policy
              </h3>
              <p className="text-[10px] text-slate-400">
                Determines how file write/exec intents are validated.
              </p>
            </div>

            {/* Three security states selectors */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-1 flex space-x-1">
              <button
                onClick={() => {
                  setSecurityMode("strict");
                  addLog("local-executor", "warning", "Safety level set to STRICT. Manual validation checks enforced on all events.");
                }}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                  securityMode === "strict"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                🔒 Strict Verification
              </button>
              <button
                onClick={() => {
                  setSecurityMode("sandbox");
                  addLog("local-executor", "warning", "Safety level altered to SANDBOX. Automatic verification for reads; manual review for updates.");
                }}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                  securityMode === "sandbox"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                🛡️ Sandbox Pilot
              </button>
              <button
                onClick={() => {
                  setSecurityMode("yolo");
                  addLog("local-executor", "error", "WARNING: Safety Policy is set to YOLO (Auto-Approve). Bypassing safety review blocks.");
                }}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                  securityMode === "yolo"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                ⚠️ YOLO Mode
              </button>
            </div>
          </div>

          {/* ACTIVE INTERCEPTED CODE DIFF INTERCEPT POPUP */}
          {showDiffStep && (
            <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden animate-fade-in">
              <div className="absolute right-0 top-0 bg-amber-500/10 border-l border-b border-amber-500/20 px-3 py-1 text-[9px] font-mono font-bold text-amber-400 tracking-wide uppercase">
                Safety Verification Request
              </div>

              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-white">Manual Safe Gate Intercept</h4>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    The Cloud agent requests local modifications. Review code difference below before granting execution approval:
                  </p>
                </div>
              </div>

              {/* Display Diff Section check */}
              {showDiffStep.action === "write_file" && showDiffStep.path ? (
                <div className="mb-4">
                  <DiffViewer
                    oldContent={workspace[showDiffStep.path] || ""}
                    newContent={showDiffStep.content || ""}
                    fileName={showDiffStep.path}
                  />
                </div>
              ) : showDiffStep.action === "execute_shell" ? (
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 mb-4 font-mono text-xs space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">Proposed Shell Command</p>
                  <p className="text-white font-semibold flex items-center">
                    <span className="text-indigo-400 mr-2">$</span>
                    {showDiffStep.command}
                  </p>
                </div>
              ) : null}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={rejectCurrentStep}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-rose-400 text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center cursor-pointer"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Reject & Abort
                </button>
                <button
                  onClick={approveCurrentStep}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-5 py-2 rounded-xl transition flex items-center shadow-lg shadow-amber-950/40 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Grant Write Authority
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC VIEWPORT & FILE EXPLORER TABS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
            {/* Nav tabs bar */}
            <div className="bg-slate-950 border-b border-slate-850 px-4 py-2 flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab("workspace")}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                    activeTab === "workspace"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  🖥️ Workspace IDE & Live Stage
                </button>
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                    activeTab === "logs"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  📁 Pipeline Logs Feed
                </button>
                <button
                  onClick={() => setActiveTab("docs")}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                    activeTab === "docs"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  📘 Protocol Architecture
                </button>
              </div>

              {/* Status Indicator inside Workspace tab */}
              {activeTab === "workspace" && (
                <span className="flex items-center text-[10px] text-slate-500 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                  Local Host Alive
                </span>
              )}
            </div>

            {/* TAB CONTAINER 1: WORKSPACE IDE (IDE ON TOP, LIVE SIMULATION VIEW ON BOTTOM) */}
            {activeTab === "workspace" && (
              <div className="flex-1 flex flex-col divide-y divide-slate-800">
                {/* Visual File Sidebar and Editor */}
                <div className="grid grid-cols-1 md:grid-cols-12 md:divide-x md:divide-slate-800 min-h-[280px]">
                  {/* Local Virtual File Tree Sidebar (3 cols) */}
                  <div className="md:col-span-3 bg-slate-950/60 p-3 space-y-3">
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider px-2">
                      Local Filesystem
                    </p>
                    <div className="space-y-1">
                      {Object.keys(workspace).map((filePath) => {
                        const isCurrent = filePath === selectedFile;
                        return (
                          <button
                            key={filePath}
                            onClick={() => setSelectedFile(filePath)}
                            className={`w-full text-left font-mono text-xs px-2.5 py-1.5 rounded-lg transition flex items-center justify-between group ${
                              isCurrent
                                ? "bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500"
                                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                            }`}
                          >
                            <span className="flex items-center space-x-2 truncate">
                              <FileCode className={`w-3.5 h-3.5 ${isCurrent ? "text-indigo-400" : "text-slate-500"}`} />
                              <span className="truncate">{filePath}</span>
                            </span>
                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Visual Editor (9 cols) */}
                  <div className="md:col-span-9 flex flex-col bg-slate-900">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-850 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono flex items-center gap-1">
                        <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                        executor_workspace:///{selectedFile}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleEditorCodeSave}
                          className="text-[10px] font-bold border border-slate-800 bg-slate-950 hover:bg-slate-850 hover:text-white px-2 py-1 rounded text-slate-300 transition"
                        >
                          Save State
                        </button>
                      </div>
                    </div>

                    {/* Integrated clean edit block */}
                    <textarea
                      value={editedCode}
                      onChange={(e) => setEditedCode(e.target.value)}
                      className="flex-1 w-full bg-slate-950/80 p-4 font-mono text-[11px] text-slate-200 outline-none leading-5 resize-none min-h-[220px]"
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* BOTTOM HALF: LIVE VIEWPORT SIMULATOR STAGE */}
                <div className="p-4 bg-slate-950/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-xs text-slate-200">Local Sandbox Dynamic Viewport</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Active: virtual_address://index.html
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Your dynamic sandbox live applet preview compiles immediately below. Type weather, todo plans inside prompts to watch the Cloud Agent auto update this view!
                  </p>

                  <div className="border border-slate-850 rounded-2xl bg-slate-900 overflow-hidden relative shadow-lg">
                    {/* Simulated Iframe browser top rail */}
                    <div className="bg-slate-950 border-b border-slate-800 px-4 py-1.5 flex items-center space-x-2">
                      <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"></div>
                      </div>
                      <div className="flex-1 max-w-sm bg-slate-900 text-[10px] text-slate-400 px-3 py-0.5 rounded-md text-center font-mono mx-auto select-none overflow-hidden truncate">
                        http://localhost:3000/index.html
                      </div>
                      <div className="w-8"></div>
                    </div>

                    <div className="bg-slate-950 min-h-[240px] flex flex-col relative">
                      {renderedUrl ? (
                        <iframe
                          src={renderedUrl}
                          title="Simulated Environment Preview"
                          className="w-full min-h-[240px] border-none bg-slate-900"
                        />
                      ) : (
                        <div className="flex items-center justify-center p-8 text-xs text-slate-600">
                          Empty sandboxed stage (No index.html loaded).
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* VISUAL TERMINAL OUTPUT WINDOW */}
                <div className="bg-black/90 p-4 font-mono text-[10.5px] text-indigo-400 space-y-1 max-h-48 overflow-y-auto border-t border-slate-800">
                  <p className="text-slate-500 text-[9px] uppercase font-semibold font-mono tracking-wider mb-1.5 flex items-center">
                    <Terminal className="w-3 h-3 mr-1" /> Replicated Local Console Terminal
                  </p>
                  {terminalOutput.map((l, i) => (
                    <div key={i} className="line leading-relaxed">
                      <span className="text-slate-600 select-none">❯ </span>
                      <span className="break-all whitespace-pre-wrap">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTAINER 2: SECURE FLOW INTEGRATION LOGS */}
            {activeTab === "logs" && (
              <div className="p-4 flex-1 flex flex-col space-y-4">
                <div className="flex justify-between items-center bg-slate-950/60 border border-slate-850 p-3 rounded-xl gap-2">
                  <div className="flex items-start space-x-2 text-xs">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-slate-400">
                      Real-time chronological events triggered between cloud agent models and safe bouncer mechanisms. This shows how exponential backoffs act instantly under load.
                    </p>
                  </div>
                </div>

                <div className="flex-1 bg-slate-950/80 border border-slate-850 rounded-xl p-4 font-mono text-[11px] overflow-y-auto space-y-2 max-h-[420px]">
                  {logs.slice().reverse().map((log) => {
                    let textClass = "text-slate-300";
                    let prefixColor = "text-indigo-400";
                    if (log.type === "success") {
                      textClass = "text-emerald-300";
                      prefixColor = "text-emerald-500";
                    } else if (log.type === "warning") {
                      textClass = "text-amber-300";
                      prefixColor = "text-amber-500";
                    } else if (log.type === "error") {
                      textClass = "text-rose-300";
                      prefixColor = "text-rose-500";
                    }

                    return (
                      <div key={log.id} className="border-b border-slate-900/60 pb-2 flex items-start gap-2">
                        <span className="text-slate-600 select-none text-[10px] shrink-0">[{log.timestamp}]</span>
                        <span className={`font-semibold shrink-0 uppercase text-[10px] ${prefixColor}`}>
                          {log.source.replace("-", " ")}:
                        </span>
                        <div className="flex-1">
                          <p className={`leading-relaxed ${textClass}`}>{log.text}</p>
                          {log.payload && (
                            <pre className="text-[9px] bg-slate-900/40 p-2 rounded-lg border border-slate-850 mt-1.5 text-slate-500 overflow-x-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTAINER 3: DETAILED PROTOCOL ARCHITECTURE */}
            {activeTab === "docs" && (
              <div className="p-6 flex-1 max-w-2xl mx-auto">
                <ArchitectureDocs />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* REACTION ADVICES BAR FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/50 p-4 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Made for 100% Free Tiers with exponential backup algorithm shielding us from rate ceilings.</span>
        </p>
      </footer>
    </div>
  );
}
