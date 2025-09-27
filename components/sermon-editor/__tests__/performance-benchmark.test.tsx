import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { MarkdownEditor, MarkdownEditorHandle } from '../MarkdownEditor';

// Performance benchmark utilities
interface BenchmarkResult {
  operation: string;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  documentSize: number;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  async measureOperation<T>(
    operation: string,
    documentSize: number,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const memoryBefore = this.getMemoryUsage();
    const startTime = performance.now();
    
    const result = await fn();
    
    const endTime = performance.now();
    const memoryAfter = this.getMemoryUsage();
    
    this.results.push({
      operation,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      documentSize,
    });
    
    return result;
  }

  private getMemoryUsage(): number {
    if (typeof (global as any).performance?.memory !== 'undefined') {
      return (global as any).performance.memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  getAverageForOperation(operation: string): number {
    const operationResults = this.results.filter(r => r.operation === operation);
    if (operationResults.length === 0) return 0;
    
    const totalDuration = operationResults.reduce((sum, r) => sum + r.duration, 0);
    return totalDuration / operationResults.length;
  }

  clear(): void {
    this.results = [];
  }

  printReport(): void {
    console.log('\n=== Performance Benchmark Report ===');
    
    const operations = [...new Set(this.results.map(r => r.operation))];
    
    operations.forEach(operation => {
      const results = this.results.filter(r => r.operation === operation);
      const avgDuration = this.getAverageForOperation(operation);
      const minDuration = Math.min(...results.map(r => r.duration));
      const maxDuration = Math.max(...results.map(r => r.duration));
      const avgMemoryDelta = results.reduce((sum, r) => sum + (r.memoryAfter - r.memoryBefore), 0) / results.length;
      
      console.log(`\n${operation}:`);
      console.log(`  Samples: ${results.length}`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Memory Delta: ${avgMemoryDelta.toFixed(2)}MB`);
    });
    
    console.log('\n=====================================\n');
  }
}

// Generate test content of specific sizes
const generateTestContent = (size: number): string => {
  const baseText = 'This is test content for performance benchmarking. It includes **bold**, *italic*, and ==highlighted== text. ';
  const repetitions = Math.ceil(size / baseText.length);
  return baseText.repeat(repetitions).substring(0, size);
};

describe('MarkdownEditor Performance Benchmarks', () => {
  let benchmark: PerformanceBenchmark;
  let onChangeText: jest.Mock;
  let editorRef: React.RefObject<MarkdownEditorHandle>;

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
    onChangeText = jest.fn();
    editorRef = React.createRef<MarkdownEditorHandle>();
  });

  afterEach(() => {
    benchmark.printReport();
  });

  describe('Document Size Performance', () => {
    const documentSizes = [1000, 5000, 10000, 25000, 50000, 100000];

    documentSizes.forEach(size => {
      it(`should render ${size} character document within performance targets`, async () => {
        const content = generateTestContent(size);
        
        const renderTime = await benchmark.measureOperation(
          `Render ${size} chars`,
          size,
          async () => {
            const { getByTestId } = render(
              <MarkdownEditor
                ref={editorRef}
                value={content}
                onChangeText={onChangeText}
                testID="markdown-editor"
                optimizeForLargeDocuments={true}
              />
            );
            
            return getByTestId('markdown-editor');
          }
        );

        expect(renderTime).toBeTruthy();
        
        // Performance targets based on document size
        const avgRenderTime = benchmark.getAverageForOperation(`Render ${size} chars`);
        
        if (size <= 10000) {
          expect(avgRenderTime).toBeLessThan(50); // Small docs: <50ms
        } else if (size <= 50000) {
          expect(avgRenderTime).toBeLessThan(200); // Medium docs: <200ms
        } else {
          expect(avgRenderTime).toBeLessThan(500); // Large docs: <500ms
        }
      });
    });
  });

  describe('Text Input Performance', () => {
    it('should handle text input efficiently across document sizes', async () => {
      const sizes = [10000, 25000, 50000];
      
      for (const size of sizes) {
        const content = generateTestContent(size);
        
        const { getByTestId } = render(
          <MarkdownEditor
            ref={editorRef}
            value={content}
            onChangeText={onChangeText}
            testID="markdown-editor"
            optimizeForLargeDocuments={true}
          />
        );

        const textInput = getByTestId('markdown-editor');
        
        await benchmark.measureOperation(
          `Text input ${size} chars`,
          size,
          async () => {
            act(() => {
              fireEvent.changeText(textInput, content + ' new text');
            });
          }
        );
      }

      // Text input should be consistently fast
      sizes.forEach(size => {
        const avgTime = benchmark.getAverageForOperation(`Text input ${size} chars`);
        expect(avgTime).toBeLessThan(100); // All text input should be <100ms
      });
    });
  });

  describe('Selection Performance', () => {
    it('should handle selection changes efficiently', async () => {
      const sizes = [10000, 25000, 50000];
      
      for (const size of sizes) {
        const content = generateTestContent(size);
        
        const { getByTestId } = render(
          <MarkdownEditor
            ref={editorRef}
            value={content}
            onChangeText={onChangeText}
            testID="markdown-editor"
            optimizeForLargeDocuments={true}
          />
        );

        const textInput = getByTestId('markdown-editor');
        
        await benchmark.measureOperation(
          `Selection ${size} chars`,
          size,
          async () => {
            act(() => {
              fireEvent(textInput, 'selectionChange', {
                nativeEvent: {
                  selection: { start: Math.floor(size / 2), end: Math.floor(size / 2) + 10 }
                }
              });
            });
          }
        );
      }

      // Selection should be consistently fast
      sizes.forEach(size => {
        const avgTime = benchmark.getAverageForOperation(`Selection ${size} chars`);
        expect(avgTime).toBeLessThan(50); // All selection changes should be <50ms
      });
    });
  });

  describe('Formatting Performance', () => {
    it('should apply formatting efficiently', async () => {
      const content = generateTestContent(25000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set selection first
      act(() => {
        fireEvent(textInput, 'selectionChange', {
          nativeEvent: {
            selection: { start: 1000, end: 1020 }
          }
        });
      });

      const formatOperations = ['bold', 'italic', 'heading2', 'list'];
      
      for (const format of formatOperations) {
        await benchmark.measureOperation(
          `Format ${format}`,
          content.length,
          async () => {
            act(() => {
              editorRef.current?.applyFormat(format as any);
            });
          }
        );
      }

      // Formatting should be fast
      formatOperations.forEach(format => {
        const avgTime = benchmark.getAverageForOperation(`Format ${format}`);
        expect(avgTime).toBeLessThan(100); // All formatting should be <100ms
      });
    });
  });

  describe('View Mode Switching Performance', () => {
    it('should switch between markup and preview modes efficiently', async () => {
      const content = generateTestContent(30000);
      
      // Test markup mode
      const { rerender } = render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          viewMode="markup"
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
        />
      );

      // Switch to preview mode
      await benchmark.measureOperation(
        'Switch to preview',
        content.length,
        async () => {
          rerender(
            <MarkdownEditor
              ref={editorRef}
              value={content}
              onChangeText={onChangeText}
              viewMode="formatted"
              testID="markdown-editor"
              optimizeForLargeDocuments={true}
            />
          );
        }
      );

      // Switch back to markup mode
      await benchmark.measureOperation(
        'Switch to markup',
        content.length,
        async () => {
          rerender(
            <MarkdownEditor
              ref={editorRef}
              value={content}
              onChangeText={onChangeText}
              viewMode="markup"
              testID="markdown-editor"
              optimizeForLargeDocuments={true}
            />
          );
        }
      );

      // View mode switching should be reasonably fast
      expect(benchmark.getAverageForOperation('Switch to preview')).toBeLessThan(300);
      expect(benchmark.getAverageForOperation('Switch to markup')).toBeLessThan(200);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should maintain reasonable memory usage across document sizes', async () => {
      const sizes = [10000, 25000, 50000, 100000];
      const memoryResults: { size: number; memory: number }[] = [];
      
      for (const size of sizes) {
        const content = generateTestContent(size);
        
        await benchmark.measureOperation(
          `Memory usage ${size} chars`,
          size,
          async () => {
            const { getByTestId, unmount } = render(
              <MarkdownEditor
                ref={editorRef}
                value={content}
                onChangeText={onChangeText}
                testID="markdown-editor"
                optimizeForLargeDocuments={true}
              />
            );
            
            const textInput = getByTestId('markdown-editor');
            
            // Simulate some interactions
            act(() => {
              fireEvent.changeText(textInput, content + ' test');
              fireEvent(textInput, 'selectionChange', {
                nativeEvent: {
                  selection: { start: 100, end: 110 }
                }
              });
            });
            
            // Clean up
            unmount();
            
            return textInput;
          }
        );
      }

      // Memory usage should scale reasonably with document size
      const results = benchmark.getResults().filter(r => r.operation.includes('Memory usage'));
      results.forEach(result => {
        const memoryDelta = result.memoryAfter - result.memoryBefore;
        
        // Memory delta should be reasonable (less than 10MB per operation)
        expect(memoryDelta).toBeLessThan(10);
        
        // Memory should not grow excessively with document size
        const memoryPerChar = memoryDelta / result.documentSize * 1024 * 1024; // bytes per char
        expect(memoryPerChar).toBeLessThan(100); // Less than 100 bytes per character
      });
    });
  });

  describe('Stress Test Benchmarks', () => {
    it('should handle rapid successive operations', async () => {
      const content = generateTestContent(20000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Perform rapid text changes
      await benchmark.measureOperation(
        'Rapid text changes',
        content.length,
        async () => {
          for (let i = 0; i < 10; i++) {
            act(() => {
              fireEvent.changeText(textInput, content + ` change ${i}`);
            });
          }
        }
      );

      // Perform rapid selection changes
      await benchmark.measureOperation(
        'Rapid selections',
        content.length,
        async () => {
          for (let i = 0; i < 10; i++) {
            act(() => {
              fireEvent(textInput, 'selectionChange', {
                nativeEvent: {
                  selection: { start: i * 100, end: i * 100 + 10 }
                }
              });
            });
          }
        }
      );

      // Rapid operations should complete within reasonable time
      expect(benchmark.getAverageForOperation('Rapid text changes')).toBeLessThan(500);
      expect(benchmark.getAverageForOperation('Rapid selections')).toBeLessThan(200);
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain performance targets for common operations', async () => {
      const content = generateTestContent(25000); // Medium-sized document
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Test multiple common operations
      const operations = [
        {
          name: 'Type text',
          action: () => fireEvent.changeText(textInput, content + ' new text'),
          target: 50,
        },
        {
          name: 'Select text',
          action: () => fireEvent(textInput, 'selectionChange', {
            nativeEvent: { selection: { start: 1000, end: 1010 } }
          }),
          target: 25,
        },
        {
          name: 'Apply bold',
          action: () => editorRef.current?.applyFormat('bold'),
          target: 75,
        },
        {
          name: 'Apply heading',
          action: () => editorRef.current?.applyFormat('heading2'),
          target: 75,
        },
      ];

      for (const operation of operations) {
        await benchmark.measureOperation(
          operation.name,
          content.length,
          async () => {
            act(() => {
              operation.action();
            });
          }
        );

        const avgTime = benchmark.getAverageForOperation(operation.name);
        expect(avgTime).toBeLessThan(operation.target);
      }
    });
  });
});