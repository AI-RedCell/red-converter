import { Shield, Lock, Eye, EyeOff, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { clearAllData } from '@/lib/storage';

// ===== #75 - CLEAR ALL DATA =====
interface ClearDataButtonProps {
  onClear?: () => void;
}

export function ClearDataButton({ onClear }: ClearDataButtonProps) {
  const handleClear = () => {
    if (confirm('⚠️ This will permanently delete ALL your data:\n\n• History\n• Favorites\n• Settings\n• Saved pipelines\n\nThis action cannot be undone. Continue?')) {
      clearAllData();
      onClear?.();
      window.location.reload();
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClear}
      className="flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/30 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      <span>Clear All Data</span>
    </motion.button>
  );
}

// ===== #76 - PRIVACY NOTICE =====
export function PrivacyNotice() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-primary">
        <Lock className="w-5 h-5" />
        <h3 className="font-semibold">Privacy First</h3>
      </div>
      
      <ul className="text-sm text-muted-foreground space-y-2">
        <li className="flex items-start gap-2">
          <Shield className="w-4 h-4 mt-0.5 text-green-500" />
          <span><strong>100% Client-Side:</strong> All processing happens in your browser. Nothing is sent to any server.</span>
        </li>
        <li className="flex items-start gap-2">
          <EyeOff className="w-4 h-4 mt-0.5 text-green-500" />
          <span><strong>No Tracking:</strong> We don't use cookies, analytics, or any form of tracking.</span>
        </li>
        <li className="flex items-start gap-2">
          <Lock className="w-4 h-4 mt-0.5 text-green-500" />
          <span><strong>Secure Storage:</strong> Your data is stored locally in IndexedDB, never transmitted.</span>
        </li>
        <li className="flex items-start gap-2">
          <Eye className="w-4 h-4 mt-0.5 text-green-500" />
          <span><strong>Open Source:</strong> Verify our code - it's fully transparent and auditable.</span>
        </li>
      </ul>
    </motion.div>
  );
}

// ===== #77 - NO ANALYTICS BADGE =====
export function NoAnalyticsBadge() {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-medium cursor-default"
    >
      <Shield className="w-3 h-3" />
      <span>No Analytics • No Tracking</span>
    </motion.div>
  );
}

// Combined Privacy Panel for Settings
export function PrivacyPanel({ onClear }: { onClear?: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Privacy & Security</h2>
        <NoAnalyticsBadge />
      </div>
      
      <PrivacyNotice />
      
      <div className="pt-4 border-t border-border">
        <h3 className="text-sm font-medium mb-3 text-destructive">Danger Zone</h3>
        <ClearDataButton onClear={onClear} />
        <p className="text-xs text-muted-foreground mt-2">
          This will erase all your history, settings, and saved pipelines permanently.
        </p>
      </div>
    </div>
  );
}
