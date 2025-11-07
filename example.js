import WikipediaCrawler from './src/crawler.js';

/**
 * Simple example demonstrating how to crawl a single Wikipedia page
 */
async function crawlSinglePage() {
  const crawler = new WikipediaCrawler();
  
  try {
    await crawler.init();
    
    // Crawl a single Wikipedia page
    const url = 'https://en.wikipedia.org/wiki/Web_scraping';
    const result = await crawler.crawlPage(url);
    
    console.log('\n=== Page Information ===');
    console.log('Title:', result.title);
    console.log('URL:', result.url);
    console.log('Text Length:', result.rawTextLength, 'characters');
    console.log('\n=== First 500 Characters ===');
    console.log(result.filteredText.substring(0, 500));
    console.log('...\n');
    
    // Save to file
    await crawler.saveToFile(result, 'single_page_result.json');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await crawler.close();
  }
}

crawlSinglePage();
