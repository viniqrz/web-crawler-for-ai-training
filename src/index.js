import WikipediaCrawler from './crawler.js';

/**
 * Example usage of the Wikipedia crawler
 */
async function main() {
  // Create a new crawler instance
  const crawler = new WikipediaCrawler({
    headless: true,
    outputDir: './output'
  });

  try {
    // Initialize the crawler
    await crawler.init();

    // Example Wikipedia URLs to crawl
    const wikipediaUrls = [
      'https://en.wikipedia.org/wiki/Artificial_intelligence',
      'https://en.wikipedia.org/wiki/Machine_learning',
      'https://en.wikipedia.org/wiki/Natural_language_processing'
    ];

    console.log('Starting Wikipedia crawl...\n');

    // Crawl multiple pages
    const results = await crawler.crawlMultiple(wikipediaUrls);

    // Display results summary
    console.log('\n=== Crawl Results Summary ===');
    results.forEach((result, index) => {
      if (result.error) {
        console.log(`\n${index + 1}. ERROR: ${result.url}`);
        console.log(`   Error: ${result.error}`);
      } else {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Text length: ${result.rawTextLength} characters`);
        console.log(`   Preview: ${result.filteredText.substring(0, 150)}...`);
      }
    });

    // Save results to file
    const outputFile = await crawler.saveToFile(results, 'wikipedia_crawl_results.json');
    console.log(`\n✓ Complete! Results saved to ${outputFile}`);

  } catch (error) {
    console.error('Crawler error:', error);
  } finally {
    // Always close the browser
    await crawler.close();
  }
}

// Run the main function
main().catch(console.error);
