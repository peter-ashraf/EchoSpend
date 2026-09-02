import { useRef, useState } from 'react';
import { X, DownloadSimple, UploadSimple } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { exportData, importData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');

  const handleExport = async () => {
    const jsonString = await exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echospend-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Backup exported successfully!');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = await importData(content);
        if (success) {
          setStatus('Data imported successfully!');
        } else {
          setStatus('Failed to import data. Invalid format.');
        }
        setTimeout(() => setStatus(''), 3000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // reset
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="w-full max-w-md glass-panel border-b-0 rounded-b-none sm:rounded-2xl p-6 shadow-2xl relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-surface hover:bg-surface/80 transition-colors"
            >
              <X weight="bold" />
            </button>
            
            <h3 className="text-xl font-bold mb-6">Settings</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-background/50 rounded-xl border border-surface-border">
                <h4 className="font-semibold mb-2">Data Backup</h4>
                <p className="text-xs text-gray-400 mb-4">Export your data to a JSON file to save to your Google Drive or local device, or import a previous backup.</p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleExport}
                    className="flex-1 py-3 rounded-xl bg-surface border border-surface-border font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-surface/80 text-primary"
                  >
                    <DownloadSimple weight="bold" /> Export
                  </button>
                  <button 
                    onClick={handleImportClick}
                    className="flex-1 py-3 rounded-xl bg-surface border border-surface-border font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-surface/80 text-success"
                  >
                    <UploadSimple weight="bold" /> Import
                  </button>
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              
              {status && (
                <p className={`text-sm text-center ${status.includes('successfully') ? 'text-success' : 'text-danger'}`}>
                  {status}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
