import React from "react";
import { RateLimitStats, RenderState } from "../types";
import { Shield, Zap, AlertTriangle, CloudRain, Clock, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface FreeTierBossControlsProps {
  rateLimit: RateLimitStats;
  renderState: RenderState;
  onWakeup: () => void;
  onToggleSleep: () => void;
  onResetRateLimiter: () => void;
}

export default function FreeTierBossControls({
  rateLimit,
  renderState,
  onWakeup,
  onToggleSleep,
  onResetRateLimiter,
}: FreeTierBossControlsProps) {
  // Calculate backoff progress
  const backoffProgress = rateLimit.backoffActive && rateLimit.backoffSecondsRemaining > 0
    ? (rateLimit.backoffSecondsRemaining / (Math.pow(2, rateLimit.retryCount) || 1)) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* 1. RENDER CLOUD HOST STATE CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <CloudRain className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-sm text-slate-200">Render Cloud Server</h3>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
              renderState.status === "online"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : renderState.status === "waking"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            ● {renderState.status.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Render's free-tier web services auto-spin down after 15 minutes of inactivity, causing a
          <strong> 30s-60s cold start</strong>.
        </p>

        {renderState.status === "sleeping" ? (
          <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl space-y-3">
            <div className="flex items-start space-x-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Server is deep asleep. Sending triggers will initiate a cold start.</span>
            </div>
            <button
              onClick={onWakeup}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center space-x-2 shadow-lg shadow-sky-950/40"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Send Wakeup Connection Trigger</span>
            </button>
          </div>
        ) : renderState.status === "waking" ? (
          <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center">
                <RefreshCw className="w-3 h-3 animate-spin mr-1.5" />
                Spawning cluster...
              </span>
              <span className="font-mono text-[10px]">{renderState.timeUntilWakeup}s</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-amber-500 to-sky-400 h-1.5"
                initial={{ width: 0 }}
                animate={{ width: `${renderState.wakeupProgress}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="text-[10px] text-slate-500 italic max-w-xs leading-normal">
              Architecture solution: Local React client automatically queues inputs and issues non-blocking HEAD requests at 3s intervals with fallback timeouts to establish the link.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs text-emerald-300">
              <span className="font-medium">Pipe active (WebSocket Connected)</span>
              <span className="text-[10px] font-mono text-emerald-400">RTT: 42ms</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              WebSocket holding open. Every user prompt runs immediately through the warm container without delay!
            </p>
            <button
              onClick={onToggleSleep}
              className="w-full border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-medium py-1.5 rounded-lg transition"
            >
              Simulate Post-15m Timeout (Put Server to Sleep)
            </button>
          </div>
        )}
      </div>

      {/* 2. GEMINI RATE LIMIT BOUNCER CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm text-slate-200">Gemini Rate Limit Bouncer</h3>
          </div>
          <span className="text-xs text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">
            10 RPM CAP
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          The Gemini free API restricts speed to <strong>10 Requests Per Minute</strong>. Autonomous agents calling multiple tools easily trip this ceiling. Excellent code avoids crashing on 429 status.
        </p>

        {/* Meters */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-500 font-mono uppercase">This Minute</p>
            <p className="text-xl font-bold text-white mt-1 font-mono">
              {rateLimit.requestsThisMinute} <span className="text-xs text-slate-600">/ 10</span>
            </p>
          </div>
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-500 font-mono uppercase">Retry Factor</p>
            <p className="text-xl font-bold text-slate-300 mt-1 font-mono">
              x{rateLimit.retryCount ? Math.pow(2, rateLimit.retryCount) : 0} <span className="text-[10px] text-slate-600">s</span>
            </p>
          </div>
        </div>

        {rateLimit.backoffActive ? (
          <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-red-300 font-medium">
              <span className="flex items-center animate-pulse">
                <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Triggering Backoff Algorithm...
              </span>
              <span className="font-mono text-red-400">{rateLimit.backoffSecondsRemaining.toFixed(1)}s</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1">
              <div
                className="bg-red-500 h-1 transition-all duration-100"
                style={{ width: `${backoffProgress}%` }}
              ></div>
            </div>
            <p className="text-[9px] text-slate-500 italic leading-normal">
              Solution: Exponential Backoff + Random Jitter: <code className="text-indigo-400">t = 2^n + random_jitter()</code>. This disperses hits so requests succeed without server crash.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs p-2 bg-slate-950/40 border border-slate-800/60 rounded-lg">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Active Connection Queue Guarded</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Idle state</span>
            </div>
            <button
              onClick={onResetRateLimiter}
              className="w-full border border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-slate-300 text-xs py-1.5 rounded-lg transition"
            >
              Reset Rate Limiter Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
