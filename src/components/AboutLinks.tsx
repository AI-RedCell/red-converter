import { Github, Star, ExternalLink, Heart, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';

// ===== #100 - GITHUB STAR LINK =====

const GITHUB_REPO_URL = 'https://github.com/yourusername/red-converter';

export function GitHubStarButton() {
  return (
    <motion.a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-colors"
    >
      <Github className="w-4 h-4" />
      <span className="font-medium">Star on GitHub</span>
      <Star className="w-4 h-4 text-yellow-400" />
    </motion.a>
  );
}

export function GitHubLink() {
  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Github className="w-4 h-4" />
      <span>GitHub</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

// ===== #99 - FEEDBACK LINK (Simple) =====
export function FeedbackLink() {
  return (
    <a
      href={`${GITHUB_REPO_URL}/issues/new`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
    >
      <Heart className="w-4 h-4" />
      <span>Send Feedback</span>
    </a>
  );
}

// About Card
export function AboutCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary/50 border border-border rounded-lg p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">R</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Red Converter</h2>
          <p className="text-sm text-muted-foreground">v2.0.0 • MIT License</p>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Advanced text transformation suite for encoding, decoding, and analysis.
        Built for developers, CTF players, and security researchers.
      </p>
      
      <div className="flex flex-wrap gap-3">
        <GitHubStarButton />
        <FeedbackLink />
      </div>
      
      <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <span>Made with</span>
        <Heart className="w-3 h-3 text-red-500" fill="currentColor" />
        <span>and</span>
        <Coffee className="w-3 h-3 text-yellow-600" />
      </div>
    </motion.div>
  );
}
