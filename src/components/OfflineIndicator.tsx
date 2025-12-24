import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

// ===== #60 - OFFLINE INDICATOR =====
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show if initially offline
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`
            fixed top-4 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-2 px-4 py-2 rounded-full
            text-sm font-medium shadow-lg
            ${isOnline 
              ? 'bg-success/20 text-success border border-success/30' 
              : 'bg-destructive/20 text-destructive border border-destructive/30 animate-pulse'}
          `}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Back online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>You're offline - App still works!</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
