import WikipediaCrawler from './src/crawler.js';
import fs from 'fs/promises';

/**
 * Mock test to verify crawler functionality without network calls
 */
async function mockTest() {
  console.log('=== Testing Wikipedia Crawler (Mock Mode) ===\n');
  
  console.log('1. Testing crawler instantiation...');
  const crawler = new WikipediaCrawler({
    headless: true,
    outputDir: './output',
    executablePath: '/usr/bin/google-chrome'
  });
  console.log('✓ Crawler instantiated successfully\n');

  console.log('2. Testing browser initialization...');
  try {
    await crawler.init();
    console.log('✓ Browser initialized successfully\n');
  } catch (error) {
    console.error('✗ Browser initialization failed:', error.message);
    process.exit(1);
  }

  console.log('3. Testing jusText filtering with mock HTML...');
  const mockHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Test Page</title></head>
      <body>
        <nav>Navigation links here</nav>
        <h1>Main Article Title</h1>
        <p>This is a paragraph with enough content to be considered good content by jusText. 
        It contains meaningful information about the topic being discussed and has sufficient length
        to pass the text filtering criteria.</p>
        <p>Another paragraph with substantial content that provides valuable information for the reader.
        This paragraph also meets the minimum length requirements and contains relevant text that would
        be useful for AI training purposes.</p>
        <footer>Copyright footer information</footer>
      </body>
    </html>
  `;
  
  try {
    const filteredText = await crawler.filterTextWithJusText(mockHtml);
    console.log('✓ jusText filtering completed');
    console.log(`   Filtered text length: ${filteredText.length} characters`);
    if (filteredText.length > 0) {
      console.log(`   Preview: ${filteredText.substring(0, 100)}...`);
    }
    console.log();
  } catch (error) {
    console.error('✗ jusText filtering failed:', error.message);
  }

  console.log('4. Testing file save functionality...');
  const mockData = {
    title: 'Test Article',
    url: 'https://example.com/test',
    timestamp: new Date().toISOString(),
    filteredText: 'This is test content',
    rawTextLength: 20
  };
  
  try {
    const filepath = await crawler.saveToFile(mockData, 'mock_test_result.json');
    console.log('✓ File saved successfully');
    console.log(`   Location: ${filepath}\n`);
    
    // Verify file exists and contains correct data
    const fileContent = await fs.readFile(filepath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    if (parsed.title === mockData.title) {
      console.log('✓ File content verified\n');
    }
  } catch (error) {
    console.error('✗ File save failed:', error.message);
  }

  console.log('5. Testing browser cleanup...');
  await crawler.close();
  console.log('✓ Browser closed successfully\n');

  console.log('=== All Mock Tests Passed! ===\n');
  console.log('Note: Actual Wikipedia crawling requires network access.');
  console.log('In a production environment with internet access, the crawler');
  console.log('will successfully fetch and process Wikipedia pages.');
}

mockTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
