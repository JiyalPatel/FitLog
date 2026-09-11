// src/components/routine/RoutineImportExportModal.tsx
import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, FileJson, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Routine } from '../../types';

interface RoutineImportExportModalProps {
  isOpen: boolean;
  routine: Routine;
  onImportRoutine: (imported: Routine) => void;
  onClose: () => void;
}

export const RoutineImportExportModal: React.FC<RoutineImportExportModalProps> = ({
  isOpen,
  routine,
  onImportRoutine,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedRoutine, setParsedRoutine] = useState<Routine | null>(null);

  if (!isOpen) return null;

  const exportDataString = JSON.stringify(
    {
      app: 'FitLog',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      routine: {
        name: routine.name,
        description: routine.description,
        targetDaysPerWeek: routine.targetDaysPerWeek,
        days: routine.days.map((d) => ({
          name: d.name,
          dayOrder: d.dayOrder,
          estimatedMinutes: d.estimatedMinutes,
          exercises: d.exercises.map((e) => ({
            name: e.name,
            muscleGroup: e.muscleGroup,
            targetSets: e.targetSets,
            targetRepsMin: e.targetRepsMin,
            targetRepsMax: e.targetRepsMax,
            notes: e.notes,
            orderIndex: e.orderIndex,
          })),
        })),
      },
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(exportDataString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([exportDataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitlog-routine-${routine.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      validateAndParse(content);
    };
    reader.readAsText(file);
  };

  const validateAndParse = (text: string) => {
    setImportError(null);
    setParsedRoutine(null);

    try {
      const parsed = JSON.parse(text);
      const routineObj = parsed.routine || parsed;

      if (!routineObj.name || !Array.isArray(routineObj.days) || routineObj.days.length === 0) {
        setImportError('Invalid routine format. Must contain a routine name and at least 1 workout day.');
        return;
      }

      // Re-map with clean IDs
      const cleanRoutine: Routine = {
        id: `routine-${Date.now()}`,
        name: routineObj.name,
        description: routineObj.description || 'Imported routine',
        currentQueueIndex: 0,
        targetDaysPerWeek: routineObj.targetDaysPerWeek || 5,
        createdAt: new Date().toISOString(),
        days: routineObj.days.map((d: any, dIdx: number) => ({
          id: `day-${Date.now()}-${dIdx}`,
          name: d.name || `Day ${dIdx + 1}`,
          dayOrder: dIdx,
          estimatedMinutes: d.estimatedMinutes || 50,
          exercises: (d.exercises || []).map((e: any, eIdx: number) => ({
            id: `ex-${Date.now()}-${dIdx}-${eIdx}`,
            name: e.name,
            muscleGroup: e.muscleGroup || 'Chest',
            targetSets: e.targetSets || 3,
            targetRepsMin: e.targetRepsMin || 8,
            targetRepsMax: e.targetRepsMax || 12,
            notes: e.notes || '',
            orderIndex: eIdx,
          })),
        })),
      };

      setParsedRoutine(cleanRoutine);
    } catch {
      setImportError('Invalid JSON format. Please verify the code or file contents.');
    }
  };

  const handleApplyImport = () => {
    if (!parsedRoutine) return;
    onImportRoutine(parsedRoutine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl flex flex-col text-white relative max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Import & Export Routine</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Share or load your workout schedule</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-1 p-1 bg-zinc-900 rounded-xl mt-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'export' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Export Routine
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'import' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Import Routine
          </button>
        </div>

        {/* Tab 1: Export */}
        {activeTab === 'export' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-3">
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="text-xs font-semibold text-white">{routine.name}</div>
              <div className="text-[11px] font-mono text-zinc-400">
                {routine.days.length} workout days · {routine.days.reduce((a, d) => a + d.exercises.length, 0)} total exercises
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Routine JSON Code</span>
                <button
                  onClick={handleCopy}
                  className="text-xs font-mono text-zinc-300 hover:text-white flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={exportDataString}
                className="w-full h-40 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-300 focus:outline-none resize-none"
              />
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-white text-black font-bold font-mono text-xs rounded-xl shadow-glow-sm hover:bg-zinc-200 transition-colors uppercase flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD FILE (.JSON)</span>
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs rounded-xl hover:text-white flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Import */}
        {activeTab === 'import' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-3">
            {/* File Upload Area */}
            <div>
              <label className="block p-4 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 text-center cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
                <span className="text-xs font-mono text-zinc-300 block">Click to upload .json routine file</span>
                <span className="text-[10px] font-mono text-zinc-500">Supports exported FitLog routines</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Paste JSON Area */}
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                Or Paste Routine JSON
              </span>
              <textarea
                placeholder="Paste routine JSON code here..."
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  validateAndParse(e.target.value);
                }}
                className="w-full h-28 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-white resize-none"
              />
            </div>

            {/* Error Message */}
            {importError && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Preview of Validated Routine */}
            {parsedRoutine && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">Ready to Import</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-black font-bold">
                    VALID ROUTINE
                  </span>
                </div>
                <div className="text-sm font-bold text-white">{parsedRoutine.name}</div>
                <div className="flex flex-wrap gap-1">
                  {parsedRoutine.days.map((d) => (
                    <span
                      key={d.id}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800"
                    >
                      {d.name} ({d.exercises.length} ex)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button */}
            <button
              onClick={handleApplyImport}
              disabled={!parsedRoutine}
              className="w-full py-3.5 bg-white text-black font-bold font-mono text-xs rounded-xl shadow-glow-sm hover:bg-zinc-200 transition-colors uppercase disabled:opacity-40"
            >
              LOAD THIS ROUTINE INTO SCHEDULE
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
