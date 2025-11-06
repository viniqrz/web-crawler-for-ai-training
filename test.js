import WikipediaCrawler from './src/crawler.js';

/**
 * Test script to verify the crawler works correctly
 */
async function test() {
  console.log('=== Testing Wikipedia Crawler ===\n');
  
  const crawler = new WikipediaCrawler({
    headless: true,
    outputDir: './output',
    // Use system Chrome if available, otherwise let Puppeteer use its default
    executablePath: process.env.CHROME_PATH || undefined
  });

  try {
    console.log('1. Testing browser initialization...');
    await crawler.init();
    console.log('✓ Browser initialized successfully\n');

    console.log('2. Testing single page crawl...');
    const testUrl = 'https://en.wikipedia.org/wiki/Web_scraping';
    const result = await crawler.crawlPage(testUrl);
    
    console.log('✓ Page crawled successfully');
    console.log(`   Title: ${result.title}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Text length: ${result.rawTextLength} characters`);
    console.log(`   Has filtered text: ${result.filteredText.length > 0 ? 'Yes' : 'No'}`);
    
    if (result.filteredText.length > 0) {
      console.log(`   Preview: ${result.filteredText.substring(0, 100)}...`);
    }
    console.log();

    console.log('3. Testing file save...');
    await crawler.saveToFile(result, 'test_result.json');
    console.log('✓ File saved successfully\n');

    console.log('=== All Tests Passed! ===');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await crawler.close();
  }
}

test();
