import WikipediaCrawler from '../src/crawler.js';
import fs from 'fs/promises';

/**
 * Advanced example showing configuration usage and batch processing
 */
async function advancedExample() {
  console.log('=== Advanced Wikipedia Crawler Example ===\n');
  
  // Load configuration
  let config;
  try {
    const configData = await fs.readFile('./config.json', 'utf-8');
    config = JSON.parse(configData);
  } catch (error) {
    console.error('Failed to load config.json, using defaults');
    config = {
      crawler: { headless: true, outputDir: './output' }
    };
  }

  // Create crawler with configuration
  const crawler = new WikipediaCrawler(config.crawler);
  
  try {
    await crawler.init();
    console.log('✓ Crawler initialized\n');

    // Define Wikipedia topics to crawl
    const topics = [
      'Artificial_intelligence',
      'Machine_learning',
      'Deep_learning',
      'Neural_network',
      'Natural_language_processing',
      'Computer_vision',
      'Reinforcement_learning',
      'Transformer_(machine_learning_model)'
    ];

    // Build Wikipedia URLs
    const urls = topics.map(topic => 
      `https://en.wikipedia.org/wiki/${topic}`
    );

    console.log(`Crawling ${urls.length} Wikipedia pages...\n`);

    // Crawl all pages
    const results = await crawler.crawlMultiple(urls);

    // Analyze results
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    console.log('\n=== Results Summary ===');
    console.log(`Total pages: ${results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      const totalChars = successful.reduce((sum, r) => sum + r.rawTextLength, 0);
      const avgChars = Math.round(totalChars / successful.length);
      console.log(`Total text extracted: ${totalChars.toLocaleString()} characters`);
      console.log(`Average per page: ${avgChars.toLocaleString()} characters`);
    }

    // Save results
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `wikipedia_ai_topics_${timestamp}.json`;
    await crawler.saveToFile(results, filename);

    console.log(`\n✓ Data saved to output/${filename}`);

    // Also save just the text content in a format ready for AI training
    const trainingData = successful.map(r => ({
      source: r.url,
      title: r.title,
      content: r.filteredText,
      metadata: {
        timestamp: r.timestamp,
        length: r.rawTextLength
      }
    }));

    const trainingFilename = `training_data_${timestamp}.json`;
    await crawler.saveToFile(trainingData, trainingFilename);
    console.log(`✓ Training data saved to output/${trainingFilename}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await crawler.close();
    console.log('\n✓ Crawler closed');
  }
}

advancedExample();
