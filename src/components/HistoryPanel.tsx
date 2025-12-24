import { motion, AnimatePresence } from 'framer-motion';
import { History, Star, Search, Download, Trash2, X, Copy, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { 
  getHistory, 
  searchHistory, 
  getFavorites, 
  toggleFavorite, 
  clearHistory,
  downloadHistoryAsJSON,
  HistoryEntry 
} from '@/lib/storage';

// ===== #63 - HISTORY PANEL =====
interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadEntry?: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ isOpen, onClose, onLoadEntry }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [loading, setLoading] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      if (searchQuery) {
        const results = await searchHistory(searchQuery);
        setEntries(activeTab === 'favorites' ? results.filter(e => e.favorite) : results);
      } else if (activeTab === 'favorites') {
        const favs = await getFavorites();
        setEntries(favs);
      } else {
        const history = await getHistory(100);
        setEntries(history);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
    setLoading(false);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    if (isOpen) {
      loadEntries();
    }
  }, [isOpen, loadEntries]);

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
    loadEntries();
  };

  const handleClearHistory = async () => {
    if (confirm('Clear all history? Favorites will be kept.')) {
      await clearHistory();
      loadEntries();
    }
  };

  const handleExport = () => {
    downloadHistoryAsJSON();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">History</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search - #64 */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Tabs - #67 */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'all' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'favorites' 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star className="w-4 h-4" />
                Favorites
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-4 border-b border-border">
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>

            {/* Entries List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading...</div>
              ) : entries.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No results found' : 'No history yet'}
                </div>
              ) : (
                entries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary/50 rounded-lg p-3 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.timestamp)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleFavorite(entry.id)}
                          className={`p-1 rounded ${entry.favorite ? 'text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`}
                        >
                          <Star className="w-4 h-4" fill={entry.favorite ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(entry.output)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs font-mono mb-2">
                      <div className="text-muted-foreground mb-1">Input:</div>
                      <div className="truncate">{entry.input.slice(0, 50)}{entry.input.length > 50 ? '...' : ''}</div>
                    </div>
                    
                    <div className="text-xs font-mono mb-2">
                      <div className="text-muted-foreground mb-1">Output:</div>
                      <div className="truncate text-primary">{entry.output.slice(0, 50)}{entry.output.length > 50 ? '...' : ''}</div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {entry.pipeline.map((step, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                          {step}
                        </span>
                      ))}
                    </div>

                    {onLoadEntry && (
                      <button
                        onClick={() => onLoadEntry(entry)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Load this <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
