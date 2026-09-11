// src/components/common/ConfirmDialogModal.tsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfirmDialogModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-4 text-white relative text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-white">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{message}</p>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs rounded-xl hover:text-white transition-colors"
          >
            {cancelLabel}
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className={`flex-1 py-2.5 font-bold font-mono text-xs rounded-xl transition-colors ${
              isDestructive
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            {confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
