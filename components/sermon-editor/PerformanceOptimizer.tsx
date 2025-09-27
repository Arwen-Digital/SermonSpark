import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Performance monitoring and optimization utilities
export interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  documentSize: number;
  lastUpdate: number;
  frameDrops: number;
}

export interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  enableMemoryMonitoring: boolean;
  maxDocumentSize: number;
  renderThreshold: number;
  memoryThreshold: number;
  debounceDelay: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableLazyLoading: true,
  enableVirtualization: true,
  enableMemoryMonitoring: true,
  maxDocumentSize: 100000, // 100k characters
  renderThreshold: 50000,  // 50k characters
  memoryThreshold: 100,    // 100MB
  debounceDelay: 100,      // 100ms
};

// Memory monitoring hook
export const useMemoryMonitoring = (enabled: boolean = true) => {
  const [memoryUsage, setMemoryUsage] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    const checkMemory = () => {
      // On React Native, we can estimate memory usage
      // This is a simplified approach - in production you might use native modules
      const estimatedMemory = (global as any).performance?.memory?.usedJSHeapSize || 0;
      setMemoryUsage(estimatedMemory / (1024 * 1024)); // Convert to MB
    };

    intervalRef.current = setInterval(checkMemory, 5000); // Check every 5 seconds
    checkMemory(); // Initial check

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  return memoryUsage;
};

// Performance metrics hook
export const usePerformanceMetrics = (documentSize: number) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    documentSize,
    lastUpdate: Date.now(),
    frameDrops: 0,
  });

  const memoryUsage = useMemoryMonitoring(true);
  const renderStartRef = useRef<number>(0);
  const frameDropCountRef = useRef<number>(0);

  // Track render performance
  const startRenderTracking = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRenderTracking = useCallback(() => {
    if (renderStartRef.current > 0) {
      const renderTime = performance.now() - renderStartRef.current;
      
      // Count as frame drop if render takes longer than 16ms (60fps)
      if (renderTime > 16) {
        frameDropCountRef.current++;
      }

      setMetrics(prev => ({
        ...prev,
        renderTime,
        memoryUsage,
        documentSize,
        lastUpdate: Date.now(),
        frameDrops: frameDropCountRef.current,
      }));
    }
  }, [memoryUsage, documentSize]);

  return {
    metrics,
    startRenderTracking,
    endRenderTracking,
  };
};

// Lazy loading hook for large documents
export const useLazyLoading = (content: string, config: PerformanceConfig) => {
  const [visibleContent, setVisibleContent] = useState(content);
  const [isLazyLoaded, setIsLazyLoaded] = useState(false);

  useEffect(() => {
    if (!config.enableLazyLoading || content.length < config.renderThreshold) {
      setVisibleContent(content);
      setIsLazyLoaded(false);
      return;
    }

    // For very large documents, initially show only a portion
    const initialChunk = content.substring(0, config.renderThreshold);
    setVisibleContent(initialChunk);
    setIsLazyLoaded(true);

    // Gradually load the rest of the content
    const loadRemainingContent = () => {
      setVisibleContent(content);
      setIsLazyLoaded(false);
    };

    // Load remaining content after a delay
    const timeoutId = setTimeout(loadRemainingContent, 500);

    return () => clearTimeout(timeoutId);
  }, [content, config.enableLazyLoading, config.renderThreshold]);

  return {
    visibleContent,
    isLazyLoaded,
  };
};

// Debounced update hook
export const useDebouncedUpdate = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

// Virtualization helper for very large documents
export const useVirtualization = (
  content: string,
  config: PerformanceConfig,
  viewportHeight: number = 600
) => {
  const [virtualizedContent, setVirtualizedContent] = useState(content);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (!config.enableVirtualization || content.length < config.maxDocumentSize) {
      setVirtualizedContent(content);
      return;
    }

    // Calculate visible range based on scroll position
    const lineHeight = 24; // Approximate line height
    const linesPerScreen = Math.ceil(viewportHeight / lineHeight);
    const bufferLines = linesPerScreen; // Buffer above and below visible area

    const lines = content.split('\n');
    const startLine = Math.max(0, Math.floor(scrollOffset / lineHeight) - bufferLines);
    const endLine = Math.min(lines.length, startLine + (linesPerScreen * 3) + bufferLines);

    const visibleLines = lines.slice(startLine, endLine);
    setVirtualizedContent(visibleLines.join('\n'));
  }, [content, scrollOffset, config.enableVirtualization, config.maxDocumentSize, viewportHeight]);

  const updateScrollOffset = useCallback((offset: number) => {
    setScrollOffset(offset);
  }, []);

  return {
    virtualizedContent,
    updateScrollOffset,
    isVirtualized: config.enableVirtualization && content.length >= config.maxDocumentSize,
  };
};

// Performance optimizer component
export interface PerformanceOptimizerProps {
  children: React.ReactNode;
  config?: Partial<PerformanceConfig>;
  onPerformanceWarning?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  children,
  config = {},
  onPerformanceWarning,
}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [performanceWarnings, setPerformanceWarnings] = useState<string[]>([]);

  // Monitor performance and trigger warnings
  useEffect(() => {
    const checkPerformance = () => {
      const warnings: string[] = [];

      // Check memory usage (web only)
      if (Platform.OS === 'web' && (global as any).performance?.memory) {
        const memory = (global as any).performance.memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        
        if (usedMB > finalConfig.memoryThreshold) {
          warnings.push(`High memory usage: ${usedMB.toFixed(1)}MB`);
        }
      }

      // Check for performance issues
      if (warnings.length > 0) {
        setPerformanceWarnings(warnings);
        onPerformanceWarning?.({
          memoryUsage: (global as any).performance?.memory?.usedJSHeapSize / (1024 * 1024) || 0,
          renderTime: 0,
          documentSize: 0,
          lastUpdate: Date.now(),
          frameDrops: 0,
        });
      }
    };

    const intervalId = setInterval(checkPerformance, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [finalConfig.memoryThreshold, onPerformanceWarning]);

  return <>{children}</>;
};

// Memory cleanup utility
export const useMemoryCleanup = () => {
  const cleanupCallbacks = useRef<(() => void)[]>([]);

  const addCleanupCallback = useCallback((callback: () => void) => {
    cleanupCallbacks.current.push(callback);
  }, []);

  const cleanup = useCallback(() => {
    cleanupCallbacks.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    });
    cleanupCallbacks.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    addCleanupCallback,
    cleanup,
  };
};

// Efficient re-rendering hook
export const useEfficientRerender = <T,>(
  value: T,
  compareFn?: (prev: T, next: T) => boolean
) => {
  const prevValueRef = useRef<T>(value);
  const [, forceUpdate] = useState({});

  const shouldUpdate = compareFn 
    ? !compareFn(prevValueRef.current, value)
    : prevValueRef.current !== value;

  useEffect(() => {
    if (shouldUpdate) {
      prevValueRef.current = value;
      forceUpdate({});
    }
  }, [value, shouldUpdate]);

  return prevValueRef.current;
};