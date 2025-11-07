import WikipediaCrawler from '../src/crawler.js';

/**
 * Simple example demonstrating Wikipedia link extraction
 */
async function linkExtractionExample() {
  console.log('=== Wikipedia Link Extraction Example ===\n');
  
  const crawler = new WikipediaCrawler({
    headless: true,
    outputDir: './output'
  });
  
  try {
    await crawler.init();

    // Extract links from a Wikipedia page
    const url = 'https://en.wikipedia.org/wiki/Machine_learning';
    console.log(`Extracting links from: ${url}\n`);

    const links = await crawler.getWikipediaLinks(url);

    console.log(`Found ${links.length} Wikipedia article links\n`);
    
    // Display first 20 links
    console.log('=== First 20 Links ===');
    links.slice(0, 20).forEach((link, index) => {
      const title = link.split('/wiki/').pop().replace(/_/g, ' ');
      console.log(`${index + 1}. ${title}`);
      console.log(`   ${link}`);
    });

    if (links.length > 20) {
      console.log(`\n... and ${links.length - 20} more links`);
    }

    // Save links to file
    await crawler.saveToFile({ url, links, count: links.length }, 'extracted_links.json');
    console.log('\n✓ Links saved to output/extracted_links.json');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await crawler.close();
  }
}

linkExtractionExample();
