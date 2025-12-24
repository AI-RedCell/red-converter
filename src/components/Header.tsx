import { motion } from "framer-motion";
import iconX from "@/assets/icon-x.png";
import logo from "@/assets/logo.png";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={`flex flex-col sm:flex-row items-center justify-between py-4 px-4 sm:px-6 gap-3 sm:gap-0 ${className}`}
    >
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <a href="https://www.airedcell.dev/" target="_blank" rel="noopener noreferrer">
          <motion.img
            src={iconX}
            alt="AI RedCell Icon"
            className="h-10 sm:h-12 w-auto neon-glow cursor-pointer"
            whileHover={{ scale: 1.05 }}
            animate={{
              filter: [
                "drop-shadow(0 0 8px hsl(0 100% 50%)) drop-shadow(0 0 16px hsl(0 100% 50% / 0.5))",
                "drop-shadow(0 0 12px hsl(0 100% 50%)) drop-shadow(0 0 24px hsl(0 100% 50% / 0.7))",
                "drop-shadow(0 0 8px hsl(0 100% 50%)) drop-shadow(0 0 16px hsl(0 100% 50% / 0.5))",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </a>
        <div className="text-center sm:text-left">
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-wider">
            <span className="text-primary neon-text">RED</span>
            <span className="text-foreground">CONVERTER</span>
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            Advanced Text Transformation Suite
          </p>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>Offline Ready</span>
        </div>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <span className="text-xs text-primary font-mono">v2.0</span>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <a href="https://www.airedcell.dev/" target="_blank" rel="noopener noreferrer">
          <motion.img
            src={logo}
            alt="AI RedCell Logo"
            className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            whileHover={{ scale: 1.05 }}
          />
        </a>
      </motion.div>
    </header>
  );
}

