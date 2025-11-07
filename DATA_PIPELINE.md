# Data Pipeline Guide

## Overview

The Data Pipeline module provides C4-like quality filtering for web-crawled content. It implements the same filtering techniques used in the Colossal Clean Crawled Corpus (C4) dataset, which is widely used for training large language models.

## Key Features

### 1. Language Identification
Automatically detects and filters content by language using statistical analysis.

**Example:**
```javascript
const pipeline = new DataPipeline({
  targetLanguages: ['eng'], // Accept only English
  minLanguageConfidence: 0.5 // Minimum 50% confidence
});
```

### 2. Quality Heuristics
Applies multiple filters to ensure high-quality training data:

- **Text Length**: Filters out very short or extremely long documents
- **Word Count**: Ensures documents have sufficient content
- **Word Length**: Filters gibberish (too short) or concatenated text (too long)
- **Punctuation**: Requires proper sentence structure
- **Bullet Points**: Reduces list-heavy content
- **Symbols & Digits**: Filters out tables, code, and non-prose content
- **Uppercase**: Filters all-caps and low-quality text
- **Vocabulary Variety**: Ensures diverse word usage

### 3. N-gram Deduplication
Removes duplicate and near-duplicate content using word-based n-grams:

- Generates overlapping sequences of N words (default: 13)
- Tracks seen n-grams across all processed documents
- Rejects documents with high overlap (default: >80%)
- Memory-efficient for large-scale processing

## Usage

### Basic Example

```javascript
import WikipediaCrawler from './src/crawler.js';
import DataPipeline from './src/pipeline.js';

const crawler = new WikipediaCrawler({ headless: true });
const pipeline = new DataPipeline({
  targetLanguages: ['eng'],
  minTextLength: 100,
  ngramSize: 13
});

await crawler.init();

// Crawl pages
const pages = await crawler.crawlMultiple(urls);

// Process through pipeline
const results = await pipeline.processBatch(pages);

// Export only quality-approved documents
const filtered = pipeline.exportFiltered(results.results);
await crawler.saveToFile(filtered, 'filtered_data.json');

await crawler.close();
```

### Advanced Configuration

```javascript
const pipeline = new DataPipeline({
  // Language settings
  targetLanguages: ['eng', 'fra'], // English and French
  minLanguageConfidence: 0.7,
  
  // Length filters
  minTextLength: 200,
  maxTextLength: 50000,
  minWordCount: 50,
  
  // Word quality
  minAvgWordLength: 3,
  maxAvgWordLength: 15,
  
  // Structure filters
  minLinesEndingWithPunctuation: 0.6,
  maxBulletPointRatio: 0.3,
  maxEllipsisLineRatio: 0.2,
  
  // Content composition
  maxSymbolToWordRatio: 0.15,
  maxDigitRatio: 0.1,
  maxUppercaseRatio: 0.15,
  minUniqueWordsRatio: 0.4,
  
  // Deduplication
  ngramSize: 13,
  ngramOverlapThreshold: 0.7
});
```

## Pipeline Output

### Document Results

Each processed document includes:

```javascript
{
  // Original document fields
  title: "Page Title",
  url: "https://...",
  filteredText: "...",
  
  // Pipeline results
  pipeline: {
    passed: true,  // Overall pass/fail
    
    filters: {
      // Which filters failed (if any)
      tooShort: false,
      language: false,
      duplicate: false,
      // ... other filters
    },
    
    metrics: {
      // Language detection
      language: {
        detected: "eng",
        confidence: 0.98,
        allDetections: [...]
      },
      
      // Text statistics
      textLength: 5432,
      wordCount: 987,
      uniqueWordCount: 456,
      uniqueWordsRatio: 0.46,
      avgWordLength: 5.2,
      
      // Structure metrics
      linesEndingWithPunctuationRatio: 0.85,
      bulletPointRatio: 0.05,
      ellipsisLineRatio: 0.01,
      
      // Composition metrics
      digitRatio: 0.02,
      uppercaseRatio: 0.12,
      symbolToWordRatio: 0.08,
      
      // Deduplication
      ngramDuplication: {
        passed: true,
        overlapRatio: 0.15,
        totalNGrams: 974,
        duplicateNGrams: 146
      }
    }
  }
}
```

### Batch Statistics

```javascript
{
  results: [...], // All processed documents
  
  stats: {
    total: 100,
    passed: 78,
    failed: 22,
    failureReasons: {
      language: 5,
      tooShort: 8,
      duplicate: 9
    }
  },
  
  passRate: 0.78
}
```

## Best Practices

### 1. Start with Lenient Settings

When first using the pipeline, start with lenient settings and gradually tighten:

```javascript
const pipeline = new DataPipeline({
  minTextLength: 50,           // Start low
  minLinesEndingWithPunctuation: 0.3,  // Start lenient
  ngramOverlapThreshold: 0.9   // Start high
});
```

### 2. Monitor Statistics

Track pipeline statistics to understand your data:

```javascript
const results = await pipeline.processBatch(documents);
console.log(`Pass rate: ${(results.passRate * 100).toFixed(1)}%`);
console.log('Failure reasons:', results.stats.failureReasons);
```

### 3. Reset Between Batches

When processing independent batches, reset the pipeline to clear n-gram memory:

```javascript
// Process batch 1
await pipeline.processBatch(batch1);

// Reset before batch 2
pipeline.reset();

// Process batch 2
await pipeline.processBatch(batch2);
```

### 4. Export Both Versions

Save both filtered and unfiltered results for analysis:

```javascript
// Save all results with pipeline metadata
await crawler.saveToFile(results.results, 'all_results.json');

// Save only passing documents
const filtered = pipeline.exportFiltered(results.results);
await crawler.saveToFile(filtered, 'filtered_results.json');
```

## Configuration Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `targetLanguages` | Array<string> | `['eng']` | ISO 639-3 language codes to accept |
| `minLanguageConfidence` | number | `0.5` | Minimum confidence (0-1) for language detection |
| `minTextLength` | number | `100` | Minimum text length in characters |
| `maxTextLength` | number | `100000` | Maximum text length in characters |
| `minWordCount` | number | `20` | Minimum number of words |
| `minAvgWordLength` | number | `3` | Minimum average word length |
| `maxAvgWordLength` | number | `15` | Maximum average word length |
| `minLinesEndingWithPunctuation` | number | `0.5` | Minimum ratio of lines ending with punctuation |
| `maxBulletPointRatio` | number | `0.5` | Maximum ratio of bullet-point lines |
| `maxEllipsisLineRatio` | number | `0.3` | Maximum ratio of lines with ellipsis |
| `maxSymbolToWordRatio` | number | `0.1` | Maximum ratio of symbols to words |
| `maxDigitRatio` | number | `0.15` | Maximum ratio of digits in text |
| `maxUppercaseRatio` | number | `0.2` | Maximum ratio of uppercase letters |
| `minUniqueWordsRatio` | number | `0.3` | Minimum ratio of unique words |
| `ngramSize` | number | `13` | N-gram size for deduplication |
| `ngramOverlapThreshold` | number | `0.8` | Maximum n-gram overlap ratio (0-1) |

## Performance Considerations

### Memory Usage

The pipeline stores n-grams in memory for deduplication. For large-scale processing:

- Monitor memory: `pipeline.getStats().memoryUsage`
- Process in batches and reset between batches
- Consider lowering `ngramSize` for reduced memory usage

### Processing Speed

The pipeline is optimized for throughput:

- Language detection: ~1-2ms per document
- Metrics calculation: ~1-2ms per document  
- N-gram generation: ~5-10ms per document
- Total: ~10-15ms per document (CPU-bound)

For 10,000 documents: ~2-3 minutes

## Examples

See the `examples/` directory for complete examples:

- `examples/pipeline-example.js` - Full pipeline demonstration
- `test-pipeline.js` - Unit tests and usage patterns

## Troubleshooting

### High Rejection Rate

If too many documents are rejected:

1. Check `results.stats.failureReasons` to identify the main issues
2. Adjust the most restrictive filters
3. Review sample rejected documents to understand why

### Language Detection Issues

If language detection is incorrect:

1. Ensure sufficient text length (minimum 50-100 characters)
2. Lower `minLanguageConfidence` for mixed-language content
3. Add multiple target languages if content is multilingual

### Memory Issues

If running out of memory:

1. Process documents in smaller batches
2. Call `pipeline.reset()` between batches
3. Reduce `ngramSize` (e.g., from 13 to 9)
4. Consider processing in parallel with separate pipeline instances

## References

- [C4 Dataset Paper](https://arxiv.org/abs/1910.10683) - Original C4 filtering methodology
- [franc](https://github.com/wooorm/franc) - Language detection library used
