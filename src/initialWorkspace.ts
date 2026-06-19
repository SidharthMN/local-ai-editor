import { Workspace } from "./types";

export const INITIAL_WORKSPACE: Workspace = {
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Dynamic Showcase</title>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-6 select-none font-sans">
    <div class="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-xl space-y-6 text-center">
        <h1 class="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
            Initial Frame
        </h1>
        <p class="text-slate-400 text-sm">
            This is the initial dynamic sandbox view. Enter a prompt on the left to instruct the cloud agent to analyze and code replacements on this workspace in real-time!
        </p>
        <div class="p-4 bg-slate-950/50 border border-slate-700/40 rounded-2xl">
            <p class="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Status Indicator</p>
            <p class="text-xs text-indigo-400 font-semibold mt-1">Listening for changes...</p>
        </div>
    </div>
</body>
</html>`,

  "src/index.js": `// Workspace dynamic scripts
console.log("Welcome to the Sandbox Workspace Runtime Context!");

// Initialize components dynamically
function updateStatusBadge() {
  const badge = document.querySelector(".status-indicator");
  if (badge) {
    badge.textContent = "Secure Channel Synchronized";
    badge.classList.add("text-emerald-400");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateStatusBadge();
});`,

  "package.json": `{
  "name": "simulated-local-workspace",
  "version": "1.0.0",
  "description": "Secure container sandbox running under safety gates",
  "dependencies": {
    "canvas-confetti": "^1.6.0"
  },
  "scripts": {
    "build": "echo 'Compiling sources...' && sleep 1 && echo 'Assets compiled: dist/index.html'",
    "test": "echo 'Running unit tests...' && sleep 1 && echo 'All tests passed: 4/4 green (100% success)'"
  }
}`,

  "README.md": `# Secure Client Executor Sandbox

This directory represents the local executor workspace.
The remote Cloud Brain can make structured JSON requests to:
- \`read_file\`
- \`write_file\`
- \`execute_shell\`

The local hand (React Client) evaluates these commands against your **Security Level** config (Strict, Sandbox, YOLO) before writing any disk assets or performing operations.
`
};
