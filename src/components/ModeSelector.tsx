import { motion } from 'framer-motion';
import { TransformMode } from '@/lib/transformations';
import { Code, Search } from 'lucide-react';

interface ModeSelectorProps {
  mode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
}

const modes: { id: TransformMode; label: string; icon: typeof Code; description: string }[] = [
  { id: 'encode', label: 'Encode', icon: Code, description: 'Transform data' },
  { id: 'decode', label: 'Decode', icon: Code, description: 'Reverse transform' },
  { id: 'detect', label: 'Detect', icon: Search, description: 'Auto-detect' },
];

// Custom Decode icon since lucide doesn't have one
function DecodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex justify-center">
      <motion.div 
        className="glass-card p-1.5 inline-flex gap-1 w-full xs:w-auto max-w-sm xs:max-w-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {modes.map((m, index) => {
          const isActive = mode === m.id;
          const Icon = m.id === 'decode' ? DecodeIcon : m.icon;
          
          return (
            <motion.button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`
                relative flex-1 xs:flex-none px-4 xs:px-6 py-3 rounded-lg font-display text-xs xs:text-sm font-semibold uppercase tracking-wider
                transition-all duration-300 flex items-center justify-center gap-2
                ${isActive 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: isActive ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  layoutId="mode-bg"
                  className="absolute inset-0 bg-primary rounded-lg neon-border"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{m.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
