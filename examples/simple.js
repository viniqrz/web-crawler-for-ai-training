import WikipediaCrawler from '../src/crawler.js';

/**
 * Simple example - crawl a single Wikipedia page
 */
async function simpleExample() {
  const crawler = new WikipediaCrawler({
    headless: true,
    outputDir: './output'
  });
  
  try {
    await crawler.init();
    
    // Crawl a single page
    const result = await crawler.crawlPage(
      'https://en.wikipedia.org/wiki/Web_scraping'
    );
    
    console.log('Title:', result.title);
    console.log('Text Length:', result.rawTextLength);
    console.log('\nFirst 200 characters:');
    console.log(result.filteredText.substring(0, 200) + '...');
    
    // Save to file
    await crawler.saveToFile(result, 'simple_example.json');
    
  } finally {
    await crawler.close();
  }
}

simpleExample();
