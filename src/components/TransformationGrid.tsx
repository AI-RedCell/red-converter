import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transformation, TransformMode, getTransformationsForMode } from '@/lib/transformations';
import { getReversibilityBadge, getRiskIcon } from '@/lib/pipeline';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface TransformationGridProps {
  mode: TransformMode;
  onSelect: (transformation: Transformation, mode: 'encode' | 'decode') => void;
}

export function TransformationGrid({ mode, onSelect }: TransformationGridProps) {
  const transformations = getTransformationsForMode(mode);
  
  // Group by category
  const categories = useMemo(() => {
    return transformations.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {} as Record<string, Transformation[]>);
  }, [transformations]);

  // Track open state per category - all open by default
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Initialize all categories as closed (collapsed by default)
  useEffect(() => {
    const allClosed = Object.keys(categories).reduce(
      (acc, cat) => ({ ...acc, [cat]: false }),
      {} as Record<string, boolean>
    );
    setOpenCategories(prev => {
      // Keep existing states, add new categories as closed
      const merged = { ...allClosed };
      Object.keys(prev).forEach(key => {
        if (key in merged) {
          merged[key] = prev[key];
        }
      });
      return merged;
    });
  }, [categories]);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const collapseAll = () => {
    setOpenCategories(
      Object.keys(categories).reduce(
        (acc, cat) => ({ ...acc, [cat]: false }),
        {} as Record<string, boolean>
      )
    );
  };

  const expandAll = () => {
    setOpenCategories(
      Object.keys(categories).reduce(
        (acc, cat) => ({ ...acc, [cat]: true }),
        {} as Record<string, boolean>
      )
    );
  };

  const allExpanded = Object.values(openCategories).every(v => v);
  const allCollapsed = Object.values(openCategories).every(v => !v);

  const handleSelect = (t: Transformation) => {
    if (mode === 'detect') {
      if (t.canDecode) {
        onSelect(t, 'decode');
      } else if (t.canEncode) {
        onSelect(t, 'encode');
      }
    } else {
      onSelect(t, mode as 'encode' | 'decode');
    }
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Collapse/Expand All Buttons */}
      <div className="flex items-center justify-end gap-2">
        <motion.button
          onClick={collapseAll}
          disabled={allCollapsed}
          className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors
            ${allCollapsed 
              ? 'bg-secondary/30 text-muted-foreground cursor-not-allowed' 
              : 'bg-secondary/50 text-foreground hover:bg-secondary/80 hover:text-primary'
            }`}
          whileHover={!allCollapsed ? { scale: 1.02 } : {}}
          whileTap={!allCollapsed ? { scale: 0.98 } : {}}
        >
          <ChevronRight className="w-3 h-3" />
          Collapse All
        </motion.button>
        <motion.button
          onClick={expandAll}
          disabled={allExpanded}
          className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors
            ${allExpanded 
              ? 'bg-secondary/30 text-muted-foreground cursor-not-allowed' 
              : 'bg-secondary/50 text-foreground hover:bg-secondary/80 hover:text-primary'
            }`}
          whileHover={!allExpanded ? { scale: 1.02 } : {}}
          whileTap={!allExpanded ? { scale: 0.98 } : {}}
        >
          <ChevronDown className="w-3 h-3" />
          Expand All
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {Object.entries(categories).map(([category, items], catIndex) => (
          <Collapsible
            key={category}
            open={openCategories[category]}
            onOpenChange={() => toggleCategory(category)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: catIndex * 0.05 }}
              className="glass-card rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <h3 className="text-xs font-display uppercase tracking-widest text-primary">
                    {category}
                  </h3>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                    {items.length}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: openCategories[category] ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-primary" />
                </motion.div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-3 pt-0 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((t, index) => {
                    const badge = getReversibilityBadge(t.reversibility);
                    const risk = getRiskIcon(t.riskLevel);
                    
                    return (
                      <motion.button
                        key={t.id}
                        onClick={() => handleSelect(t)}
                        className="transform-card text-left group"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {t.name}
                          </h4>
                          <motion.div 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ rotate: 90 }}
                          >
                            <Plus className="w-4 h-4 text-primary" />
                          </motion.div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {t.description}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                          
                          <span className={`text-[10px] ${
                            t.riskLevel === 'high' ? 'text-destructive' :
                            t.riskLevel === 'medium' ? 'text-warning' : 'text-success'
                          }`}>
                            {risk}
                          </span>
                          
                          <div className="flex gap-1 ml-auto">
                            {t.canEncode && mode !== 'decode' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                E
                              </span>
                            )}
                            {t.canDecode && mode !== 'encode' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                                D
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </motion.div>
          </Collapsible>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}