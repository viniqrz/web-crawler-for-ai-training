import WikipediaCrawler from '../src/crawler.js';

/**
 * Example demonstrating recursive Wikipedia crawling with link extraction
 * This example crawls up to 100 pages recursively and generates a URL tree visualization
 */
async function recursiveCrawlExample() {
  console.log('=== Recursive Wikipedia Crawler Example ===\n');
  
  const crawler = new WikipediaCrawler({
    headless: true,
    outputDir: './output'
  });
  
  try {
    await crawler.init();
    console.log('✓ Crawler initialized\n');

    // Starting page
    const startUrl = 'https://en.wikipedia.org/wiki/Artificial_intelligence';
    
    console.log(`Starting recursive crawl from: ${startUrl}`);
    console.log('This may take several minutes...\n');

    // Perform recursive crawl with limits
    const result = await crawler.crawlRecursive(startUrl, {
      maxPages: 100,    // Maximum number of pages to crawl
      maxDepth: 3       // Maximum depth to follow links
    });

    console.log('\n=== Crawl Complete ===');
    console.log(`Total pages crawled: ${result.totalPages}`);
    console.log(`Total pages with data: ${result.crawledData.length}`);
    
    // Calculate statistics
    const totalTextLength = result.crawledData.reduce((sum, page) => sum + page.rawTextLength, 0);
    const avgTextLength = Math.round(totalTextLength / result.crawledData.length);
    
    console.log(`Total text extracted: ${totalTextLength.toLocaleString()} characters`);
    console.log(`Average per page: ${avgTextLength.toLocaleString()} characters`);

    // Save the crawled data
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const dataFilename = `recursive_crawl_${timestamp}.json`;
    await crawler.saveToFile(result.crawledData, dataFilename);
    console.log(`\n✓ Crawled data saved to output/${dataFilename}`);

    // Save the URL tree visualization
    const treeFilename = `url_tree_${timestamp}.md`;
    await crawler.saveTreeToMarkdown(result.linkTree, treeFilename);
    console.log(`✓ URL tree visualization saved to output/${treeFilename}`);

    // Display a sample of the tree
    console.log('\n=== URL Tree Preview ===');
    const treePreview = crawler.generateMarkdownTree(result.linkTree);
    const previewLines = treePreview.split('\n').slice(0, 30);
    console.log(previewLines.join('\n'));
    if (treePreview.split('\n').length > 30) {
      console.log('...\n(See full tree in the markdown file)');
    }

    // Display some sample pages
    console.log('\n=== Sample Crawled Pages ===');
    result.crawledData.slice(0, 5).forEach((page, index) => {
      console.log(`\n${index + 1}. ${page.title}`);
      console.log(`   URL: ${page.url}`);
      console.log(`   Text length: ${page.rawTextLength} characters`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await crawler.close();
    console.log('\n✓ Crawler closed');
  }
}

recursiveCrawlExample();
