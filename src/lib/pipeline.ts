import { Transformation, transformations, Reversibility, RiskLevel } from './transformations';

export interface PipelineStep {
  id: string;
  transformationId: string;
  mode: 'encode' | 'decode';
  options?: Record<string, unknown>;
}

export interface PipelineResult {
  stepId: string;
  input: string;
  output: string;
  success: boolean;
  error?: string;
}

export interface PipelineWarning {
  type: 'irreversible' | 'data-loss' | 'chain-risk';
  message: string;
  stepIds: string[];
}

export function getTransformation(id: string): Transformation | undefined {
  return transformations.find(t => t.id === id);
}

export function executePipeline(
  input: string,
  steps: PipelineStep[]
): { results: PipelineResult[]; finalOutput: string } {
  const results: PipelineResult[] = [];
  let currentValue = input;

  for (const step of steps) {
    const transformation = getTransformation(step.transformationId);
    
    if (!transformation) {
      results.push({
        stepId: step.id,
        input: currentValue,
        output: currentValue,
        success: false,
        error: 'Transformation not found',
      });
      continue;
    }

    try {
      const fn = step.mode === 'encode' ? transformation.encode : transformation.decode;
      
      if (!fn) {
        throw new Error(`${step.mode} not supported for ${transformation.name}`);
      }

      const output = fn(currentValue, step.options);
      results.push({
        stepId: step.id,
        input: currentValue,
        output,
        success: true,
      });
      currentValue = output;
    } catch (error) {
      results.push({
        stepId: step.id,
        input: currentValue,
        output: currentValue,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { results, finalOutput: currentValue };
}

export function analyzePipeline(steps: PipelineStep[]): PipelineWarning[] {
  const warnings: PipelineWarning[] = [];
  const irreversibleSteps: string[] = [];
  const partialSteps: string[] = [];
  const hashSteps: string[] = [];
  const analysisSteps: string[] = [];

  // List of all hash transformation IDs
  const hashTransformIds = ['hash', 'sha256', 'sha512', 'md5'];
  // List of analysis transformations (one-way)
  const analysisTransformIds = ['frequency', 'char-stats', 'qrcode'];

  for (const step of steps) {
    const transformation = getTransformation(step.transformationId);
    if (!transformation) continue;

    if (transformation.reversibility === 'irreversible') {
      irreversibleSteps.push(step.id);
    } else if (transformation.reversibility === 'partial') {
      partialSteps.push(step.id);
    }

    // Track hash functions specifically
    if (hashTransformIds.includes(transformation.id)) {
      hashSteps.push(step.id);
    }

    // Track analysis functions
    if (analysisTransformIds.includes(transformation.id)) {
      analysisSteps.push(step.id);
    }
  }

  // Warning for irreversible transformations (hashes)
  if (irreversibleSteps.length > 0) {
    warnings.push({
      type: 'irreversible',
      message: '⚠️ IRREVERSIBLE: This pipeline contains one-way transformations (hashes/analysis). Original data CANNOT be recovered!',
      stepIds: irreversibleSteps,
    });
  }

  // Warning for partial data loss
  if (partialSteps.length > 0) {
    warnings.push({
      type: 'data-loss',
      message: '⚡ PARTIAL LOSS: Some transformations may lose information (e.g., case, formatting, special characters).',
      stepIds: partialSteps,
    });
  }

  // Specific warning for hash functions
  if (hashSteps.length > 0) {
    warnings.push({
      type: 'irreversible',
      message: '🔒 HASH DETECTED: Hash functions (MD5, SHA-256, SHA-512) produce fixed-length output. This is ONE-WAY encryption - you cannot decrypt the result!',
      stepIds: hashSteps,
    });
  }

  // Warning for analysis tools
  if (analysisSteps.length > 0) {
    warnings.push({
      type: 'irreversible',
      message: '📊 ANALYSIS MODE: Analysis tools show statistics/patterns, not encoded data. Output is informational only.',
      stepIds: analysisSteps,
    });
  }

  // Check for risky chains
  const hasHash = steps.some(s => hashTransformIds.includes(getTransformation(s.transformationId)?.id || ''));
  const hasEncoding = steps.some(s => {
    const t = getTransformation(s.transformationId);
    return t?.category === 'Base Encoding' && s.mode === 'encode';
  });

  if (hasHash && hasEncoding) {
    warnings.push({
      type: 'chain-risk',
      message: '⚠️ CHAIN RISK: Encoding after hashing may produce unexpected results. Hash output is already hexadecimal.',
      stepIds: steps.map(s => s.id),
    });
  }

  // Check for multiple irreversible steps
  if (irreversibleSteps.length > 1) {
    warnings.push({
      type: 'chain-risk',
      message: '🔗 MULTIPLE IRREVERSIBLE: Multiple one-way transformations detected. Each step further destroys the original data.',
      stepIds: irreversibleSteps,
    });
  }

  return warnings;
}

export function getReversibilityBadge(reversibility: Reversibility): {
  label: string;
  className: string;
} {
  switch (reversibility) {
    case 'reversible':
      return { label: 'Reversible', className: 'badge-reversible' };
    case 'partial':
      return { label: 'Partial', className: 'badge-partial' };
    case 'irreversible':
      return { label: 'Irreversible', className: 'badge-irreversible' };
  }
}

export function getRiskIcon(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'low':
      return '●';
    case 'medium':
      return '●●';
    case 'high':
      return '●●●';
  }
}
