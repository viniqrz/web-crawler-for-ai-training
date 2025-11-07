import WikipediaCrawler from '../src/crawler.js';
import DataPipeline from '../src/pipeline.js';
import fs from 'fs/promises';

/**
 * Example demonstrating the C4-like data pipeline for processing
 * crawled content with quality filtering, language identification,
 * and n-gram deduplication.
 */
async function pipelineExample() {
  const crawler = new WikipediaCrawler({
    headless: true,
    outputDir: './output'
  });

  // Initialize the data pipeline with C4-like settings
  const pipeline = new DataPipeline({
    targetLanguages: ['eng'], // English only
    minTextLength: 100,
    minWordCount: 20,
    minLinesEndingWithPunctuation: 0.5,
    ngramSize: 13,
    ngramOverlapThreshold: 0.8
  });

  try {
    await crawler.init();

    console.log('=== C4-like Data Pipeline Demo ===\n');
    console.log('Crawling Wikipedia pages...\n');

    // Crawl multiple pages - mix of good and potentially problematic content
    const urls = [
      'https://en.wikipedia.org/wiki/Artificial_intelligence',
      'https://en.wikipedia.org/wiki/Machine_learning',
      'https://en.wikipedia.org/wiki/Natural_language_processing',
      'https://en.wikipedia.org/wiki/Deep_learning',
      'https://en.wikipedia.org/wiki/Data_science'
    ];

    const crawledData = await crawler.crawlMultiple(urls);
    console.log(`✓ Crawled ${crawledData.length} pages\n`);

    // Process through the pipeline
    console.log('Processing through data pipeline...\n');
    const pipelineResults = await pipeline.processBatch(crawledData);

    // Display results
    console.log('=== Pipeline Results ===');
    console.log(`Total documents: ${pipelineResults.stats.total}`);
    console.log(`Passed filters: ${pipelineResults.stats.passed} (${(pipelineResults.passRate * 100).toFixed(1)}%)`);
    console.log(`Failed filters: ${pipelineResults.stats.failed}`);
    
    if (Object.keys(pipelineResults.stats.failureReasons).length > 0) {
      console.log('\nFailure reasons:');
      for (const [reason, count] of Object.entries(pipelineResults.stats.failureReasons)) {
        console.log(`  - ${reason}: ${count}`);
      }
    }

    console.log('\n=== Individual Document Results ===\n');
    pipelineResults.results.forEach((result, idx) => {
      const status = result.pipeline.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${idx + 1}. ${status} - ${result.title}`);
      
      if (result.pipeline.metrics.language) {
        const lang = result.pipeline.metrics.language;
        console.log(`   Language: ${lang.detected} (confidence: ${(lang.confidence * 100).toFixed(1)}%)`);
      }
      
      if (result.pipeline.metrics.wordCount !== undefined) {
        console.log(`   Words: ${result.pipeline.metrics.wordCount}, ` +
                   `Length: ${result.pipeline.metrics.textLength} chars, ` +
                   `Unique ratio: ${(result.pipeline.metrics.uniqueWordsRatio * 100).toFixed(1)}%`);
      }
      
      if (result.pipeline.metrics.ngramDuplication) {
        const dup = result.pipeline.metrics.ngramDuplication;
        console.log(`   N-gram overlap: ${(dup.overlapRatio * 100).toFixed(1)}%`);
      }
      
      if (!result.pipeline.passed) {
        const failedFilters = Object.entries(result.pipeline.filters)
          .filter(([_, failed]) => failed)
          .map(([filter, _]) => filter);
        if (failedFilters.length > 0) {
          console.log(`   Failed filters: ${failedFilters.join(', ')}`);
        }
      }
      console.log('');
    });

    // Get pipeline statistics
    const stats = pipeline.getStats();
    console.log('=== Pipeline Statistics ===');
    console.log(`Processed documents: ${stats.processedDocuments}`);
    console.log(`Unique n-grams stored: ${stats.uniqueNGrams}`);
    console.log(`Est. memory usage: ${stats.memoryUsage.estimatedMB.toFixed(2)} MB\n`);

    // Save all results with pipeline metadata
    const allResultsFile = await crawler.saveToFile(
      pipelineResults.results,
      'pipeline_all_results.json'
    );
    console.log(`✓ All results (with pipeline metadata): ${allResultsFile}`);

    // Export and save only filtered (passing) documents
    const filteredDocs = pipeline.exportFiltered(pipelineResults.results);
    const filteredFile = await crawler.saveToFile(
      filteredDocs,
      'pipeline_filtered_results.json'
    );
    console.log(`✓ Filtered results (quality-approved only): ${filteredFile}`);

    // Save processing statistics
    const statsFile = await crawler.saveToFile({
      processingStats: pipelineResults.stats,
      pipelineStats: stats,
      passRate: pipelineResults.passRate,
      timestamp: new Date().toISOString()
    }, 'pipeline_stats.json');
    console.log(`✓ Pipeline statistics: ${statsFile}`);

    console.log('\n=== Example Complete ===');
    console.log('The pipeline has successfully filtered the crawled content using:');
    console.log('- Language identification (English)');
    console.log('- Quality heuristics (text length, word count, punctuation, etc.)');
    console.log('- N-gram deduplication (13-word n-grams)');
    console.log('\nCheck the output files for detailed results!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await crawler.close();
  }
}

// Run the example
pipelineExample().catch(console.error);
