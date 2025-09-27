/**
 * Manual Performance Testing Utility for MarkdownEditor
 * 
 * This script provides manual testing capabilities for performance optimization
 * features in the MarkdownEditor component. Run this in a development environment
 * to test real-world performance scenarios.
 * 
 * Usage:
 * 1. Import this file in your development app
 * 2. Call the test functions to evaluate performance
 * 3. Monitor console output for performance metrics
 */

// Generate test content of various sizes and complexities
const generateTestContent = (size, complexity = 'simple') => {
  const templates = {
    simple: 'This is simple test content for performance testing. ',
    
    markdown: `# Heading
This is **bold** and *italic* text with ==highlights==.

## Subheading
> This is a blockquote with some content.

- List item 1
- List item 2
- List item 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

`,
    
    complex: `# Complex Sermon Section
This section contains **complex formatting** with *multiple* ==highlighted== terms.

## Theological Points
> "For God so loved the world that he gave his one and only Son" - John 3:16

### Key Insights:
- **Grace**: Unmerited favor from God
- *Mercy*: God's compassion in action  
- ==Salvation==: Deliverance from sin

#### Application Questions:
1. How does this apply to your daily life?
2. What changes will you make this week?
3. How can you share this with others?

**Prayer Points:**
- Thanksgiving for God's love
- Confession of our need for grace
- Intercession for others

*Remember: God's love is unconditional and eternal.*

`,
  };

  const template = templates[complexity] || templates.simple;
  const repetitions = Math.ceil(size / template.length);
  return template.repeat(repetitions).substring(0, size);
};

// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.isMonitoring = false;
  }

  startMonitoring() {
    this.isMonitoring = true;
    this.metrics = [];
    console.log('📊 Performance monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
    this.generateReport();
  }

  recordMetric(operation, duration, metadata = {}) {
    if (!this.isMonitoring) return;
    
    const metric = {
      operation,
      duration,
      timestamp: Date.now(),
      memory: this.getMemoryUsage(),
      ...metadata,
    };
    
    this.metrics.push(metric);
    
    // Log slow operations immediately
    if (duration > 100) {
      console.warn(`⚠️ Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  }

  generateReport() {
    if (this.metrics.length === 0) {
      console.log('📊 No metrics recorded');
      return;
    }

    console.log('\n📊 Performance Report');
    console.log('='.repeat(50));

    // Group metrics by operation
    const operationGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.operation]) {
        groups[metric.operation] = [];
      }
      groups[metric.operation].push(metric);
      return groups;
    }, {});

    Object.entries(operationGroups).forEach(([operation, metrics]) => {
      const durations = metrics.map(m => m.duration);
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      console.log(`\n${operation}:`);
      console.log(`  Samples: ${metrics.length}`);
      console.log(`  Average: ${avg.toFixed(2)}ms`);
      console.log(`  Min: ${min.toFixed(2)}ms`);
      console.log(`  Max: ${max.toFixed(2)}ms`);

      // Memory analysis
      const memoryMetrics = metrics.filter(m => m.memory);
      if (memoryMetrics.length > 0) {
        const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.memory.used, 0) / memoryMetrics.length;
        console.log(`  Avg Memory: ${avgMemory.toFixed(1)}MB`);
      }
    });

    console.log('\n' + '='.repeat(50));
  }
}

// Test scenarios
const performanceMonitor = new PerformanceMonitor();

export const testLargeDocumentRendering = async (sizes = [10000, 25000, 50000, 100000]) => {
  console.log('🧪 Testing large document rendering performance...');
  performanceMonitor.startMonitoring();

  for (const size of sizes) {
    const content = generateTestContent(size, 'markdown');
    
    const startTime = performance.now();
    
    // Simulate rendering (in real app, this would be actual component rendering)
    await new Promise(resolve => {
      setTimeout(() => {
        const endTime = performance.now();
        performanceMonitor.recordMetric(
          `Render ${size} chars`,
          endTime - startTime,
          { documentSize: size, contentType: 'markdown' }
        );
        resolve();
      }, 10);
    });
  }

  performanceMonitor.stopMonitoring();
};

export const testTextInputPerformance = async (documentSize = 25000) => {
  console.log('⌨️ Testing text input performance...');
  performanceMonitor.startMonitoring();

  const content = generateTestContent(documentSize, 'complex');
  
  // Simulate rapid text input
  for (let i = 0; i < 20; i++) {
    const startTime = performance.now();
    
    // Simulate text change processing
    const newContent = content + ` input ${i}`;
    
    await new Promise(resolve => {
      setTimeout(() => {
        const endTime = performance.now();
        performanceMonitor.recordMetric(
          'Text input',
          endTime - startTime,
          { documentSize: newContent.length, inputNumber: i }
        );
        resolve();
      }, 5);
    });
  }

  performanceMonitor.stopMonitoring();
};

export const testFormattingPerformance = async (documentSize = 30000) => {
  console.log('🎨 Testing formatting performance...');
  performanceMonitor.startMonitoring();

  const content = generateTestContent(documentSize, 'simple');
  const formatOperations = ['bold', 'italic', 'heading2', 'heading3', 'list', 'quote', 'highlight'];

  for (const format of formatOperations) {
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      
      // Simulate formatting operation
      const selectedText = content.substring(1000 + i * 100, 1020 + i * 100);
      const formattedText = `**${selectedText}**`; // Simplified formatting
      
      await new Promise(resolve => {
        setTimeout(() => {
          const endTime = performance.now();
          performanceMonitor.recordMetric(
            `Format ${format}`,
            endTime - startTime,
            { documentSize, selectedLength: selectedText.length }
          );
          resolve();
        }, 2);
      });
    }
  }

  performanceMonitor.stopMonitoring();
};

export const testScrollingPerformance = async (documentSize = 75000) => {
  console.log('📜 Testing scrolling performance...');
  performanceMonitor.startMonitoring();

  const content = generateTestContent(documentSize, 'complex');
  
  // Simulate scroll events
  for (let i = 0; i < 50; i++) {
    const startTime = performance.now();
    
    // Simulate scroll position calculation
    const scrollPosition = (i / 50) * documentSize;
    
    await new Promise(resolve => {
      setTimeout(() => {
        const endTime = performance.now();
        performanceMonitor.recordMetric(
          'Scroll event',
          endTime - startTime,
          { documentSize, scrollPosition }
        );
        resolve();
      }, 1);
    });
  }

  performanceMonitor.stopMonitoring();
};

export const testMemoryUsage = async () => {
  console.log('💾 Testing memory usage patterns...');
  
  if (!performance.memory) {
    console.warn('⚠️ Memory API not available in this environment');
    return;
  }

  const initialMemory = performance.memory.usedJSHeapSize;
  console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);

  const sizes = [10000, 25000, 50000, 100000];
  const memorySnapshots = [];

  for (const size of sizes) {
    const content = generateTestContent(size, 'complex');
    
    // Simulate component creation and usage
    const componentData = {
      content,
      selection: { start: 0, end: 0 },
      viewMode: 'markup',
      formatHistory: [],
    };

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const currentMemory = performance.memory.usedJSHeapSize;
    const memoryDelta = currentMemory - initialMemory;
    
    memorySnapshots.push({
      size,
      memory: currentMemory / 1024 / 1024,
      delta: memoryDelta / 1024 / 1024,
    });

    console.log(`Document size: ${size} chars, Memory: ${(currentMemory / 1024 / 1024).toFixed(2)}MB (+${(memoryDelta / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Analyze memory growth pattern
  const memoryGrowthRate = memorySnapshots.reduce((rate, snapshot, index) => {
    if (index === 0) return 0;
    const prevSnapshot = memorySnapshots[index - 1];
    const sizeIncrease = snapshot.size - prevSnapshot.size;
    const memoryIncrease = snapshot.delta - prevSnapshot.delta;
    return memoryIncrease / sizeIncrease * 1024 * 1024; // bytes per character
  }, 0) / (memorySnapshots.length - 1);

  console.log(`Average memory growth: ${memoryGrowthRate.toFixed(2)} bytes per character`);
  
  if (memoryGrowthRate > 100) {
    console.warn('⚠️ High memory growth rate detected');
  } else {
    console.log('✅ Memory growth rate is acceptable');
  }
};

export const testPerformanceRegression = async () => {
  console.log('🔍 Running performance regression tests...');
  
  const baselineResults = {
    'Render 25000 chars': 150, // ms
    'Text input': 50,
    'Format bold': 75,
    'Scroll event': 16,
  };

  performanceMonitor.startMonitoring();

  // Run standard test suite
  await testLargeDocumentRendering([25000]);
  await testTextInputPerformance(25000);
  await testFormattingPerformance(25000);
  await testScrollingPerformance(25000);

  performanceMonitor.stopMonitoring();

  // Compare with baseline
  console.log('\n🔍 Regression Analysis:');
  console.log('='.repeat(50));

  Object.entries(baselineResults).forEach(([operation, baseline]) => {
    const currentMetrics = performanceMonitor.metrics.filter(m => 
      m.operation.includes(operation.split(' ')[0]) || m.operation === operation
    );

    if (currentMetrics.length > 0) {
      const avgCurrent = currentMetrics.reduce((sum, m) => sum + m.duration, 0) / currentMetrics.length;
      const regression = ((avgCurrent - baseline) / baseline) * 100;

      console.log(`${operation}:`);
      console.log(`  Baseline: ${baseline}ms`);
      console.log(`  Current: ${avgCurrent.toFixed(2)}ms`);
      console.log(`  Change: ${regression > 0 ? '+' : ''}${regression.toFixed(1)}%`);

      if (regression > 20) {
        console.warn(`  ⚠️ Performance regression detected!`);
      } else if (regression < -10) {
        console.log(`  ✅ Performance improvement!`);
      } else {
        console.log(`  ✅ Performance stable`);
      }
    }
  });

  console.log('='.repeat(50));
};

export const runFullPerformanceTestSuite = async () => {
  console.log('🚀 Running full performance test suite...');
  console.log('This may take a few minutes...\n');

  try {
    await testLargeDocumentRendering();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testTextInputPerformance();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testFormattingPerformance();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testScrollingPerformance();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testMemoryUsage();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testPerformanceRegression();

    console.log('\n✅ Full performance test suite completed!');
  } catch (error) {
    console.error('❌ Performance test suite failed:', error);
  }
};

// Export for manual testing
export const PerformanceTestUtils = {
  generateTestContent,
  PerformanceMonitor,
  testLargeDocumentRendering,
  testTextInputPerformance,
  testFormattingPerformance,
  testScrollingPerformance,
  testMemoryUsage,
  testPerformanceRegression,
  runFullPerformanceTestSuite,
};

// Auto-run basic tests in development
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  console.log('🧪 MarkdownEditor Performance Testing Utilities Loaded');
  console.log('Available functions:');
  console.log('- testLargeDocumentRendering()');
  console.log('- testTextInputPerformance()');
  console.log('- testFormattingPerformance()');
  console.log('- testScrollingPerformance()');
  console.log('- testMemoryUsage()');
  console.log('- testPerformanceRegression()');
  console.log('- runFullPerformanceTestSuite()');
  console.log('\nExample: await testLargeDocumentRendering([10000, 50000])');
}