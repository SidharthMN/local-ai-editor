import React, { useEffect, useState } from "react";
import { ArrowRight, FileCode, FolderOpen, RefreshCw, Send, Shield, Sparkles, Terminal } from "lucide-react";
import { INITIAL_WORKSPACE } from "./initialWorkspace";
import { AgentStep, SecurityMode, Workspace } from "./types";

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>(INITIAL_WORKSPACE);
  const [selectedFile, setSelectedFile] = useState<string>("index.html");
  const [editedCode, setEditedCode] = useState<string>(INITIAL_WORKSPACE["index.html"]);
  const [prompt, setPrompt] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(["local-ai-editor v1.0.0", "Ready."]);
  const [securityMode, setSecurityMode] = useState<SecurityMode>("sandbox");

  useEffect(() => {
    setEditedCode(workspace[selectedFile] || "");
  }, [selectedFile, workspace]);

  const appendTerminal = (message: string) => {
    setTerminalOutput((prev) => [...prev, message]);
  };

  const handleSave = () => {
    setWorkspace((prev) => ({ ...prev, [selectedFile]: editedCode }));
    appendTerminal(`Saved ${selectedFile}`);
  };

  const handleLocalFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const nextWorkspace = { ...workspace };
    let firstPath = selectedFile;
    const filesArray = Array.from(files) as File[];

    for (const file of filesArray) {
      const content = await file.text();
      const path = `local/${file.name}`;
      nextWorkspace[path] = content;
      firstPath = path;
    }

    setWorkspace(nextWorkspace);
    setSelectedFile(firstPath);
    appendTerminal(`Imported ${files.length} local file(s)`);
    event.target.value = "";
  };

  const runAgentPrompt = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    appendTerminal(`Agent prompt: ${prompt}`);

    try {
      const response = await fetch("/api/agent/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, files: workspace }),
      });

      if (!response.ok) {
        throw new Error(`Network error ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.plan) {
        throw new Error(data.error || "Invalid agent response");
      }

      const plan = (data.plan as AgentStep[]).map((step, index) => ({
        ...step,
        id: `step-${index}-${Date.now()}`,
        status: "idle" as const,
      }));
      setSteps(plan);
      appendTerminal(`Received ${plan.length} agent step(s)`);
      await executeAgentPlan(plan);
    } catch (error: any) {
      appendTerminal(`Agent error: ${error.message || "Request failed"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAgentPlan = async (plan: AgentStep[]) => {
    for (const [index, step] of plan.entries()) {
      setSteps((prev) => prev.map((item) => (item.id === step.id ? { ...item, status: "running" } : item)));
      appendTerminal(`Running step ${index + 1}: ${step.action}`);

      await new Promise((resolve) => setTimeout(resolve, 600));

      if (step.action === "write_file" && step.path) {
        setWorkspace((prev) => ({ ...prev, [step.path!]: step.content || "" }));
        setSelectedFile(step.path!);
        appendTerminal(`Wrote ${step.path}`);
      } else if (step.action === "read_file" && step.path) {
        const content = workspace[step.path];
        appendTerminal(content ? `Read ${step.path} (${content.length} chars)` : `Missing ${step.path}`);
      } else if (step.action === "execute_shell" && step.command) {
        appendTerminal(`Shell: ${step.command}`);
        appendTerminal("Shell command completed successfully.");
      } else if (step.action === "thought") {
        appendTerminal(step.text || "Thought step completed.");
      }

      setSteps((prev) => prev.map((item) => (item.id === step.id ? { ...item, status: "completed" } : item)));
    }

    appendTerminal("Agent plan completed.");
  };

  const downloadFile = () => {
    const blob = new Blob([editedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = selectedFile.replace(/\//g, "_");
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Local AI Editor</h1>
              <p className="text-sm text-slate-400">VS Code-style editor with agent sidebar and local file import.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-300">{selectedFile}</span>
            <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-300">Mode: {securityMode}</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Explorer</p>
              <h2 className="text-base font-semibold text-white">Files</h2>
            </div>
            <button
              onClick={() => document.getElementById("local-file-input")?.click()}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900 transition"
            >
              Open
            </button>
          </div>
          <input id="local-file-input" type="file" multiple className="hidden" onChange={handleLocalFiles} />

          <div className="rounded-3xl border border-slate-800 bg-slate-950/20 p-3 text-sm text-slate-300">
            Import local files to the workspace, then edit and save them immediately.
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {Object.keys(workspace).map((path) => {
              const active = path === selectedFile;
              return (
                <button
                  key={path}
                  onClick={() => setSelectedFile(path)}
                  className={`mb-2 flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-indigo-500 bg-slate-800 text-white"
                      : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate text-sm font-medium">
                    <FileCode className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{path}</span>
                  </span>
                  {active && <span className="text-[10px] text-indigo-400">OPEN</span>}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-slate-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Editor</p>
                <h2 className="text-sm font-semibold text-white">{selectedFile}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900 transition"
              >
                Save
              </button>
              <button
                onClick={downloadFile}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-900 transition"
              >
                Download
              </button>
            </div>
          </div>

          <textarea
            value={editedCode}
            onChange={(event) => setEditedCode(event.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-slate-950 px-5 py-4 text-sm leading-6 text-slate-100 font-mono outline-none resize-none"
          />
        </section>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Agent</p>
                <h2 className="text-sm font-semibold text-white">Cloud Brain</h2>
              </div>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] text-slate-300">Agent</span>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <label className="text-sm font-semibold text-slate-100">Prompt</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              placeholder="Ask the agent to update or inspect the current file..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={runAgentPrompt}
              disabled={isProcessing || !prompt.trim()}
              className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isProcessing ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Thinking
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Send className="h-4 w-4" /> Run Agent
                </span>
              )}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Plan</p>
              <span className="text-[11px] text-slate-400">{steps.length} steps</span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1">
              {steps.length === 0 ? (
                <div className="text-sm text-slate-500">No agent steps yet. Run a prompt to generate them.</div>
              ) : (
                steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`rounded-2xl border p-3 text-sm ${
                      step.status === "completed"
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : step.status === "failed"
                        ? "border-rose-500/30 bg-rose-500/5"
                        : step.status === "running"
                        ? "border-indigo-500/30 bg-indigo-500/10"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-100">Step {index + 1}</span>
                      <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{step.status}</span>
                    </div>
                    <p className="mt-2 text-slate-300 leading-6">
                      {step.action === "thought" && step.text}
                      {step.action === "write_file" && `Write file: ${step.path}`}
                      {step.action === "read_file" && `Read file: ${step.path}`}
                      {step.action === "execute_shell" && `Shell: ${step.command}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Terminal</p>
              <span className="text-[11px] text-slate-400">Output</span>
            </div>
            <div className="min-h-[180px] overflow-y-auto rounded-3xl bg-slate-900 p-3 text-[12px] text-slate-300 font-mono leading-6">
              {terminalOutput.map((line, index) => (
                <div key={index} className="break-words">
                  <span className="text-slate-500">›</span> {line}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
