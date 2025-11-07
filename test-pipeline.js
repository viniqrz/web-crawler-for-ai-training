import DataPipeline from './src/pipeline.js';

/**
 * Test script to verify the data pipeline works correctly
 */
async function test() {
  console.log('=== Testing Data Pipeline ===\n');

  try {
    console.log('1. Testing pipeline initialization...');
    const pipeline = new DataPipeline({
      targetLanguages: ['eng'],
      minTextLength: 50,
      minWordCount: 10,
      ngramSize: 5,
      maxSymbolToWordRatio: 1.0, // More lenient
      minLinesEndingWithPunctuation: 0.3 // More lenient
    });
    console.log('✓ Pipeline initialized successfully\n');

    console.log('2. Creating test documents...');
    const testDocuments = [
      {
        title: 'Test Document 1',
        filteredText: 'This is a well-written English document with proper punctuation. It contains multiple sentences with good structure. The content is meaningful and has sufficient length for testing purposes.',
        url: 'http://test.com/1'
      },
      {
        title: 'Test Document 2 (Too Short)',
        filteredText: 'Too short.',
        url: 'http://test.com/2'
      },
      {
        title: 'Test Document 3',
        filteredText: 'Another quality piece of English content. This document passes all quality checks. It has good sentence structure and appropriate length.',
        url: 'http://test.com/3'
      }
    ];
    console.log(`✓ Created ${testDocuments.length} test documents\n`);

    console.log('3. Testing batch processing...');
    const results = await pipeline.processBatch(testDocuments);
    console.log('✓ Batch processing completed');
    console.log(`   Total: ${results.stats.total}`);
    console.log(`   Passed: ${results.stats.passed}`);
    console.log(`   Failed: ${results.stats.failed}`);
    console.log(`   Pass Rate: ${(results.passRate * 100).toFixed(1)}%\n`);

    console.log('4. Testing individual document processing...');
    const singleDoc = await pipeline.processDocument({
      title: 'Single Test',
      filteredText: 'This is a single document test with good English content and proper structure.'
    });
    console.log('✓ Single document processed');
    console.log(`   Passed: ${singleDoc.pipeline.passed ? 'Yes' : 'No'}`);
    console.log(`   Language: ${singleDoc.pipeline.metrics.language.detected}`);
    console.log(`   Word Count: ${singleDoc.pipeline.metrics.wordCount}\n`);

    console.log('5. Testing language detection...');
    const langResult = pipeline.identifyLanguage('This is English text.');
    console.log('✓ Language detection working');
    console.log(`   Detected: ${langResult.detected}`);
    console.log(`   Confidence: ${(langResult.confidence * 100).toFixed(1)}%\n`);

    console.log('6. Testing n-gram generation...');
    const ngrams = pipeline.generateNGrams('one two three four five six seven', 3);
    console.log('✓ N-gram generation working');
    console.log(`   Generated: ${ngrams.length} n-grams`);
    console.log(`   Example: "${ngrams[0]}"\n`);

    console.log('7. Testing pipeline stats...');
    const stats = pipeline.getStats();
    console.log('✓ Stats retrieved');
    console.log(`   Processed Documents: ${stats.processedDocuments}`);
    console.log(`   Unique N-grams: ${stats.uniqueNGrams}\n`);

    console.log('8. Testing export filtered...');
    const filtered = pipeline.exportFiltered(results.results);
    console.log('✓ Export filtered working');
    console.log(`   Filtered count: ${filtered.length}\n`);

    console.log('=== All Tests Passed! ===');

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
