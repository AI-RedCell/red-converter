import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { PipelineStep, PipelineResult, PipelineWarning, getTransformation, getReversibilityBadge } from '@/lib/pipeline';
import { GripVertical, X, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface PipelineEditorProps {
  steps: PipelineStep[];
  results: PipelineResult[];
  warnings: PipelineWarning[];
  onReorder: (steps: PipelineStep[]) => void;
  onRemove: (stepId: string) => void;
}

export function PipelineEditor({ steps, results, warnings, onReorder, onRemove }: PipelineEditorProps) {
  if (steps.length === 0) {
    return (
      <motion.div 
        className="glass-card p-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
          <ChevronRight className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">
          Select transformations to build your pipeline
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Drag to reorder • Click × to remove
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warnings - Enhanced with prominent styling */}
      <AnimatePresence>
        {warnings.map((warning, i) => (
          <motion.div
            key={warning.type + i}
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className={`
              flex items-start gap-3 p-4 rounded-lg text-sm font-medium
              border-2 shadow-lg
              ${warning.type === 'irreversible' 
                ? 'bg-destructive/20 border-destructive/50 text-destructive animate-pulse' 
                : warning.type === 'data-loss' 
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' 
                  : 'bg-orange-500/20 border-orange-500/50 text-orange-400'}
            `}
          >
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${warning.type === 'irreversible' ? 'animate-bounce' : ''}`} />
            <div className="flex-1">
              <span className="block">{warning.message}</span>
              {warning.type === 'irreversible' && (
                <span className="text-xs opacity-75 mt-1 block">
                  ⚠️ Proceed with caution - this action cannot be undone
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Pipeline Steps */}
      <Reorder.Group 
        axis="y" 
        values={steps} 
        onReorder={onReorder}
        className="space-y-2"
      >
        {steps.map((step, index) => {
          const transformation = getTransformation(step.transformationId);
          const result = results.find(r => r.stepId === step.id);
          const badge = transformation ? getReversibilityBadge(transformation.reversibility) : null;
          
          return (
            <Reorder.Item
              key={step.id}
              value={step}
              className="cursor-grab active:cursor-grabbing"
            >
              <motion.div 
                className={`
                  pipeline-step
                  ${result?.success === false ? 'border-destructive/50' : ''}
                  ${result?.success === true ? 'border-success/30' : ''}
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold text-sm truncate">
                      {transformation?.name || 'Unknown'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      step.mode === 'encode' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                    }`}>
                      {step.mode}
                    </span>
                    {badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  
                  {result && (
                    <motion.div 
                      className="mt-2 text-xs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {result.success ? (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                          <code className="text-muted-foreground font-mono truncate block max-w-full">
                            {result.output.slice(0, 50)}{result.output.length > 50 ? '...' : ''}
                          </code>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-destructive">
                          <XCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{result.error}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
                
                <motion.button
                  onClick={() => onRemove(step.id)}
                  className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}
