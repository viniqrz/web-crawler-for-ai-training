import WikipediaCrawler from '../src/crawler.js';

/**
 * Custom configuration example
 */
async function customConfigExample() {
  // Create crawler with custom settings
  const crawler = new WikipediaCrawler({
    headless: true,
    outputDir: './my_custom_output',
    // executablePath: '/path/to/chrome' // Uncomment to use a custom Chrome path
  });
  
  try {
    await crawler.init();
    
    // Custom list of pages
    const pages = [
      'https://en.wikipedia.org/wiki/Python_(programming_language)',
      'https://en.wikipedia.org/wiki/JavaScript',
      'https://en.wikipedia.org/wiki/TypeScript'
    ];
    
    console.log('Crawling programming language pages...\n');
    
    const results = await crawler.crawlMultiple(pages);
    
    // Process results
    results.forEach((result, i) => {
      if (!result.error) {
        console.log(`${i + 1}. ${result.title}`);
        console.log(`   Length: ${result.rawTextLength} chars\n`);
      }
    });
    
    await crawler.saveToFile(results, 'programming_languages.json');
    console.log('✓ Saved to my_custom_output/programming_languages.json');
    
  } finally {
    await crawler.close();
  }
}

customConfigExample();
