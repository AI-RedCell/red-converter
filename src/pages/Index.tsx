import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { ModeSelector } from '@/components/ModeSelector';
import { TransformationGrid } from '@/components/TransformationGrid';
import { PipelineEditor } from '@/components/PipelineEditor';
import { TextArea } from '@/components/TextArea';
import { DetectionPanel } from '@/components/DetectionPanel';
import { TransformMode, Transformation } from '@/lib/transformations';
import { PipelineStep, executePipeline, analyzePipeline, getTransformation } from '@/lib/pipeline';
import { addToHistory, initDB } from '@/lib/storage';
import { Play, Copy, Trash2, RotateCcw, History, Star, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const Index = () => {
  const [mode, setMode] = useState<TransformMode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [showPipeline, setShowPipeline] = useState(true);
  const [carrierText, setCarrierText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize IndexedDB
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  const pipelineResults = useMemo(() => {
    if (!input || pipeline.length === 0) return [];
    
    // Check if we need carrier text for zero-width encoding
    const hasZeroWidthEncode = pipeline.some(s => s.transformationId === 'zerowidth-encode');
    
    if (hasZeroWidthEncode && carrierText) {
      // Inject carrier text into zero-width encode steps
      const modifiedPipeline = pipeline.map(step => {
        if (step.transformationId === 'zerowidth-encode') {
          return { ...step, options: { ...step.options, carrier: carrierText } };
        }
        return step;
      });
      return executePipeline(input, modifiedPipeline).results;
    }
    
    return executePipeline(input, pipeline).results;
  }, [input, pipeline, carrierText]);

  const pipelineWarnings = useMemo(() => {
    return analyzePipeline(pipeline);
  }, [pipeline]);

  const finalOutput = useMemo(() => {
    if (!input || pipeline.length === 0) return '';
    
    const hasZeroWidthEncode = pipeline.some(s => s.transformationId === 'zerowidth-encode');
    
    if (hasZeroWidthEncode && carrierText) {
      const modifiedPipeline = pipeline.map(step => {
        if (step.transformationId === 'zerowidth-encode') {
          return { ...step, options: { ...step.options, carrier: carrierText } };
        }
        return step;
      });
      return executePipeline(input, modifiedPipeline).finalOutput;
    }
    
    return executePipeline(input, pipeline).finalOutput;
  }, [input, pipeline, carrierText]);

  const hasZeroWidthEncode = useMemo(() => {
    return pipeline.some(s => s.transformationId === 'zerowidth-encode');
  }, [pipeline]);

  const handleAddTransformation = useCallback((t: Transformation, stepMode: 'encode' | 'decode') => {
    const newStep: PipelineStep = {
      id: generateId(),
      transformationId: t.id,
      mode: stepMode,
    };
    setPipeline(prev => [...prev, newStep]);
    
    // Show advanced options if zero-width encode is added
    if (t.id === 'zerowidth-encode') {
      setShowAdvanced(true);
    }
    
    toast.success(`Added ${t.name} to pipeline`);
  }, []);

  const handleRemoveStep = useCallback((stepId: string) => {
    setPipeline(prev => prev.filter(s => s.id !== stepId));
  }, []);

  const handleExecute = useCallback(async () => {
    if (!input) {
      toast.error('Please enter input text');
      return;
    }
    if (pipeline.length === 0) {
      toast.error('Add transformations to the pipeline');
      return;
    }
    
    const hasZeroWidthEncode = pipeline.some(s => s.transformationId === 'zerowidth-encode');
    
    let result;
    if (hasZeroWidthEncode && carrierText) {
      const modifiedPipeline = pipeline.map(step => {
        if (step.transformationId === 'zerowidth-encode') {
          return { ...step, options: { ...step.options, carrier: carrierText } };
        }
        return step;
      });
      result = executePipeline(input, modifiedPipeline);
    } else {
      result = executePipeline(input, pipeline);
    }
    
    setOutput(result.finalOutput);
    
    // Save to history
    try {
      await addToHistory({
        input,
        output: result.finalOutput,
        pipeline: pipeline.map(s => getTransformation(s.transformationId)?.name || s.transformationId),
        favorite: false,
      });
    } catch (e) {
      console.error('Failed to save to history:', e);
    }
    
    toast.success('Pipeline executed successfully');
  }, [input, pipeline, carrierText]);

  const handleCopy = useCallback(async () => {
    const textToCopy = output || finalOutput;
    if (!textToCopy) {
      toast.error('No output to copy');
      return;
    }
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        toast.success('Copied to clipboard');
      } else {
        // Fallback for mobile/non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          toast.success('Copied to clipboard');
        } catch (err) {
          toast.error('Failed to copy');
        }
        
        textArea.remove();
      }
    } catch (err) {
      toast.error('Failed to copy');
    }
  }, [output, finalOutput]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setPipeline([]);
    setCarrierText('');
    toast.info('Cleared all data');
  }, []);

  const handleSwap = useCallback(() => {
    const textToSwap = output || finalOutput;
    if (!textToSwap) return;
    setInput(textToSwap);
    setOutput('');
  }, [output, finalOutput]);

  return (
    <div className="min-h-screen cyber-grid">
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <Header />
        
        <motion.div 
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ModeSelector mode={mode} onModeChange={setMode} />
        </motion.div>

        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          {/* Left Column - Input & Output */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Input */}
            <div className="glass-card p-4">
              <TextArea
                label="Input"
                placeholder="Enter text to transform..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                charCount
              />
            </div>

            {/* Advanced Options (Carrier Text for Steganography) */}
            <AnimatePresence>
              {(hasZeroWidthEncode || showAdvanced) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="glass-card p-4 border-primary/30"
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer mb-3"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <h3 className="text-xs font-display uppercase tracking-widest text-primary flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      Steganography Options
                    </h3>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </div>
                  
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <TextArea
                          label="Carrier Text (for zero-width encoding)"
                          placeholder="Enter visible text to hide your message within..."
                          value={carrierText}
                          onChange={(e) => setCarrierText(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Your secret message will be hidden within this carrier text using invisible characters.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pipeline */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-display uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Pipeline
                  <span className="text-muted-foreground">({pipeline.length})</span>
                </h3>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setShowPipeline(!showPipeline)}
                    className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPipeline ? 'rotate-180' : ''}`} />
                  </motion.button>
                </div>
              </div>
              
              <AnimatePresence>
                {showPipeline && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <PipelineEditor
                      steps={pipeline}
                      results={pipelineResults}
                      warnings={pipelineWarnings}
                      onReorder={setPipeline}
                      onRemove={handleRemoveStep}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleExecute}
                className="flex-1 py-3 px-6 rounded-lg bg-primary text-primary-foreground font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 neon-border"
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px hsl(var(--primary) / 0.5)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                Execute
              </motion.button>
              
              <motion.button
                onClick={handleCopy}
                className="py-3 px-4 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Copy output"
              >
                <Copy className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                onClick={handleSwap}
                className="py-3 px-4 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Swap output to input"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                onClick={handleClear}
                className="py-3 px-4 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Clear all"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Output */}
            <div className="glass-card p-4">
              <TextArea
                label="Output"
                placeholder="Transformed output will appear here..."
                value={output || finalOutput}
                readOnly
                charCount
              />
            </div>
          </motion.div>

          {/* Right Column - Transformations */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {mode === 'detect' && (
              <DetectionPanel
                input={input}
                onSelectDecoder={(t) => handleAddTransformation(t, 'decode')}
              />
            )}
            
            <div className="glass-card p-4">
              <h3 className="text-xs font-display uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                {mode === 'encode' ? 'Encoders' : mode === 'decode' ? 'Decoders' : 'All Transformations'}
              </h3>
              
              <TransformationGrid
                mode={mode}
                onSelect={handleAddTransformation}
              />
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer 
          className="mt-12 py-6 border-t border-border/30 text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-primary font-display">RED CONVERTER</span>
            <span className="hidden sm:inline">•</span>
            <span>Advanced Text Transformation Suite</span>
            <span className="hidden sm:inline">•</span>
            <span>100% Client-Side Processing</span>
          </p>
          <p className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            <a 
              href="https://github.com/AiRedCell/red-converter/blob/main/LICENSE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 hover:bg-secondary/80 transition-colors text-foreground hover:text-primary"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              Open Source • MIT License
            </a>
            <span className="hidden sm:inline text-border">|</span>
            <a 
              href="https://www.airedcell.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors group"
            >
              Made with <span className="text-primary">♥</span> by 
              <span className="font-display text-primary group-hover:underline">AI RedCell</span>
            </a>
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
