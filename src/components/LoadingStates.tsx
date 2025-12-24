import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// ===== #93 - LOADING STATES =====

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Skeleton loader for content
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-secondary rounded ${className}`}
    />
  );
}

// Processing overlay
interface ProcessingOverlayProps {
  isProcessing: boolean;
  text?: string;
}

export function ProcessingOverlay({ isProcessing, text = 'Processing...' }: ProcessingOverlayProps) {
  if (!isProcessing) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="absolute inset-0 w-8 h-8 border-2 border-primary/20 rounded-full animate-ping" />
        </div>
        <span className="text-sm font-medium">{text}</span>
      </div>
    </motion.div>
  );
}

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({ 
  isLoading, 
  loadingText = 'Loading...', 
  children, 
  disabled,
  className = '',
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`flex items-center justify-center gap-2 transition-all ${
        isLoading ? 'opacity-70 cursor-not-allowed' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
