import { forwardRef, TextareaHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  charCount?: boolean;
  maxChars?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, charCount, maxChars, value, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0;
    
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-display uppercase tracking-widest text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            className={cn(
              'w-full min-h-[120px] xs:min-h-[150px] p-4 rounded-lg resize-y',
              'bg-input/80 border border-border/50',
              'text-foreground font-mono text-sm',
              'placeholder:text-muted-foreground/50',
              'focus:border-primary focus:ring-1 focus:ring-primary/50',
              'transition-all duration-200',
              'scrollbar-thin scrollbar-thumb-primary/40',
              className
            )}
            {...props}
          />
          {charCount && (
            <motion.div 
              className={cn(
                'absolute bottom-3 right-3 text-xs font-mono',
                maxChars && currentLength > maxChars ? 'text-destructive' : 'text-muted-foreground/60'
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {currentLength.toLocaleString()}
              {maxChars && ` / ${maxChars.toLocaleString()}`}
            </motion.div>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
