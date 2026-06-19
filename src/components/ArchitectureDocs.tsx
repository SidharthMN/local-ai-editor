import React from "react";
import { HardDrive, Server, ShieldCheck, Cpu, ArrowRight } from "lucide-react";

export default function ArchitectureDocs() {
  return (
    <div className="space-y-6 text-slate-300 text-xs">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase">The Distributed Core Design</h3>
        <p className="text-slate-400 leading-relaxed">
          The concept replicates enterprise-level coding assistants: keeping your compute machinery safe and files local, while delegating the multi-million token reasoning capabilities to the cloud.
        </p>
      </div>

      {/* Visual map */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-4 font-mono text-[10px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-indigo-400 flex items-center"><Server className="w-3.5 h-3.5 mr-1" /> Cloud Brain</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-emerald-400 flex items-center"><HardDrive className="w-3.5 h-3.5 mr-1" /> Local Hand</span>
        </div>

        <div className="space-y-2 text-slate-400">
          <div className="flex justify-between">
            <span className="text-slate-500">1. Raw instructions</span>
            <span className="text-indigo-300">FastAPI / Node (Env Key)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">2. Plan output (JSON Tools)</span>
            <span className="text-indigo-300">Gemini model output parses</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">3. Local Safety evaluation</span>
            <span className="text-emerald-300">User prompts / Gate policies</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">4. Run write/exec command</span>
            <span className="text-emerald-300">Simulated disk updates</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-slate-200">The 3-Tier Client Security Gates</h4>
        <div className="space-y-2">
          <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg">
            <p className="font-semibold text-rose-400 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> STRICT SECURITY (Default)
            </p>
            <p className="text-slate-400 mt-1 leading-normal">
              Any file edit, replacement, or terminal check must be triggered with an interactive code diff window. Full control inside visual workspace.
            </p>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg">
            <p className="font-semibold text-amber-400 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> SANDBOX AUTO-PILOT
            </p>
            <p className="text-slate-400 mt-1 leading-normal">
              Allows safe actions (reading files or thoughts) silently. Prompts user to yield approval for write actions or executing code commands.
            </p>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg">
            <p className="font-semibold text-red-500 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> YOLO (AUTO-APPROVE)
            </p>
            <p className="text-slate-400 mt-1 leading-normal">
              Bypasses sandbox warnings. Cloud commands are instantly approved and dispatched into files the moment the WS connection receives them.
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-2">
        <p className="font-semibold text-indigo-300 flex items-center">
          <Cpu className="w-3.5 h-3.5 mr-1.5" /> Billing Guard Rule
        </p>
        <p className="text-slate-400 leading-normal">
          We do not attach a credit card to our GCP accounts. The moment a billing card joins a key, the free tier disappears and you are charged per token. Protect the free tier limits (daily limits of 1,500 calls) with exponential retry.
        </p>
      </div>
    </div>
  );
}
