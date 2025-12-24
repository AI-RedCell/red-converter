import { motion } from 'framer-motion';
import { detectPossibleEncodings, Transformation } from '@/lib/transformations';
import { Sparkles, ArrowRight } from 'lucide-react';

interface DetectionPanelProps {
  input: string;
  onSelectDecoder: (transformation: Transformation) => void;
}

export function DetectionPanel({ input, onSelectDecoder }: DetectionPanelProps) {
  const detected = input ? detectPossibleEncodings(input) : [];

  if (!input) {
    return (
      <motion.div 
        className="glass-card p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-3 animate-pulse" />
        <p className="text-sm text-muted-foreground">
          Enter text to auto-detect encoding
        </p>
      </motion.div>
    );
  }

  if (detected.length === 0) {
    return (
      <motion.div 
        className="glass-card p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-sm text-muted-foreground">
          No known encodings detected
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Try switching to Decode mode manually
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2 text-xs text-primary">
        <Sparkles className="w-4 h-4" />
        <span className="font-display uppercase tracking-wider">Detected Encodings</span>
      </div>
      
      <div className="grid gap-2">
        {detected.map((t, index) => (
          <motion.button
            key={t.id}
            onClick={() => onSelectDecoder(t)}
            className="glass-card-hover p-3 flex items-center justify-between group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 4 }}
          >
            <div className="text-left">
              <span className="font-semibold text-sm">{t.name}</span>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
