import React from "react";

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName: string;
}

export default function DiffViewer({ oldContent, newContent, fileName }: DiffViewerProps) {
  // If the file is entirely new, treat oldContent as empty
  const oldLines = oldContent ? oldContent.split("\n") : [];
  const newLines = newContent ? newContent.split("\n") : [];

  // Simple line-level diff calculation
  const diffLines: { text: string; type: "added" | "removed" | "normal"; lineNum?: number }[] = [];

  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length) {
      if (oldLines[oldIdx] === newLines[newIdx]) {
        diffLines.push({ text: oldLines[oldIdx], type: "normal", lineNum: newIdx + 1 });
        oldIdx++;
        newIdx++;
      } else {
        // Simple lookahead helper to detect single additions or deletions
        if (oldIdx + 1 < oldLines.length && oldLines[oldIdx + 1] === newLines[newIdx]) {
          diffLines.push({ text: oldLines[oldIdx], type: "removed" });
          oldIdx++;
        } else if (newIdx + 1 < newLines.length && oldLines[oldIdx] === newLines[newIdx + 1]) {
          diffLines.push({ text: newLines[newIdx], type: "added", lineNum: newIdx + 1 });
          newIdx++;
        } else {
          // Fallback replacement (match line-pair as removed + added)
          diffLines.push({ text: oldLines[oldIdx], type: "removed" });
          diffLines.push({ text: newLines[newIdx], type: "added", lineNum: newIdx + 1 });
          oldIdx++;
          newIdx++;
        }
      }
    } else if (oldIdx < oldLines.length) {
      diffLines.push({ text: oldLines[oldIdx], type: "removed" });
      oldIdx++;
    } else if (newIdx < newLines.length) {
      diffLines.push({ text: newLines[newIdx], type: "added", lineNum: newIdx + 1 });
      newIdx++;
    }
  }

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-950 font-mono text-xs overflow-hidden max-h-96 flex flex-col">
      <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
        <span className="text-slate-400 font-semibold">{fileName} (Diff Preview)</span>
        <div className="flex space-x-2 text-[10px]">
          <span className="flex items-center text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
            + Added
          </span>
          <span className="flex items-center text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1"></span>
            - Removed
          </span>
        </div>
      </div>
      <div className="overflow-y-auto p-3 space-y-0.5 leading-5 select-text">
        {diffLines.length === 0 ? (
          <div className="text-slate-600 text-center py-4">No content difference detected.</div>
        ) : (
          diffLines.map((line, idx) => {
            let bgClass = "text-slate-400";
            let prefix = "  ";
            if (line.type === "added") {
              bgClass = "bg-emerald-950/40 text-emerald-300 px-1 border-l-2 border-emerald-500";
              prefix = "+ ";
            } else if (line.type === "removed") {
              bgClass = "bg-rose-950/40 text-rose-300 px-1 border-l-2 border-rose-500 line-through";
              prefix = "- ";
            }

            return (
              <div key={idx} className={`flex items-start ${bgClass}`}>
                <span className="w-8 select-none text-slate-600 text-right pr-2">
                  {line.lineNum !== undefined ? line.lineNum : ""}
                </span>
                <span className="select-none text-slate-600 font-semibold mr-1">{prefix}</span>
                <span className="break-all whitespace-pre-wrap flex-1">{line.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
