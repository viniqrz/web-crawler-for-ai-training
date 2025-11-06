# Web Crawler for AI Training

A Puppeteer-based web crawler designed to gather Wikipedia pages data and filter text content using jusText. This tool extracts clean, main content from Wikipedia pages while removing boilerplate content like navigation links, headers, and footers.

## Features

- 🤖 **Puppeteer-powered**: Headless browser crawling with full JavaScript support
- 📄 **jusText Integration**: Intelligent text extraction that filters out boilerplate content
- 🌐 **Wikipedia Optimized**: Specifically designed for crawling Wikipedia pages
- 💾 **Data Export**: Save crawled data in structured JSON format
- ⚡ **Multiple Pages**: Support for crawling multiple Wikipedia URLs
- 🎯 **Clean Content**: Extracts only the main article content for AI training purposes

## Installation

```bash
# Clone the repository
git clone https://github.com/viniqrz/web-crawler-for-ai-training.git
cd web-crawler-for-ai-training

# Install dependencies
npm install
```

## Usage

### Basic Usage

Run the example crawler:

```bash
npm start
```

This will crawl three example Wikipedia pages (Artificial Intelligence, Machine Learning, and Natural Language Processing) and save the results to `output/wikipedia_crawl_results.json`.

### Custom Usage

Create your own crawler script:

```javascript
import WikipediaCrawler from './src/crawler.js';

const crawler = new WikipediaCrawler({
  headless: true,
  outputDir: './output'
});

await crawler.init();

// Crawl a single page
const result = await crawler.crawlPage('https://en.wikipedia.org/wiki/Python_(programming_language)');
console.log(result.filteredText);

// Crawl multiple pages
const urls = [
  'https://en.wikipedia.org/wiki/JavaScript',
  'https://en.wikipedia.org/wiki/TypeScript'
];
const results = await crawler.crawlMultiple(urls);

// Save to file
await crawler.saveToFile(results, 'my_results.json');

await crawler.close();
```

## API Reference

### WikipediaCrawler Class

#### Constructor Options

- `headless` (boolean): Run browser in headless mode. Default: `true`
- `outputDir` (string): Directory for output files. Default: `./output`

#### Methods

##### `async init()`
Initialize the Puppeteer browser instance.

##### `async crawlPage(url)`
Crawl a single Wikipedia page.

**Parameters:**
- `url` (string): The Wikipedia page URL to crawl

**Returns:** Object containing:
- `title`: Page title
- `url`: Page URL
- `timestamp`: Crawl timestamp
- `filteredText`: Filtered main content text
- `rawTextLength`: Length of filtered text

##### `async crawlMultiple(urls)`
Crawl multiple Wikipedia pages.

**Parameters:**
- `urls` (Array<string>): Array of Wikipedia page URLs

**Returns:** Array of crawled page data objects

##### `async saveToFile(data, filename)`
Save crawled data to a JSON file.

**Parameters:**
- `data` (Object|Array): The data to save
- `filename` (string): Output filename. Default: `'crawled_data.json'`

##### `async close()`
Close the browser and cleanup resources.

## Output Format

The crawler produces JSON output with the following structure:

```json
[
  {
    "title": "Artificial intelligence - Wikipedia",
    "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "timestamp": "2025-11-06T02:00:00.000Z",
    "filteredText": "Artificial intelligence (AI) is intelligence demonstrated by machines...",
    "rawTextLength": 15420
  }
]
```

## How It Works

1. **Puppeteer Navigation**: The crawler uses Puppeteer to navigate to Wikipedia pages with full JavaScript support
2. **HTML Extraction**: Retrieves the complete HTML content of the page
3. **jusText Filtering**: Applies the jusText algorithm to:
   - Identify and extract main content paragraphs
   - Remove navigation, headers, footers, and other boilerplate
   - Filter based on text density, stopword analysis, and link density
4. **Data Structuring**: Organizes extracted content with metadata
5. **Export**: Saves results in JSON format for easy consumption by AI training pipelines

## jusText Configuration

The crawler uses the following jusText parameters optimized for Wikipedia:

- **Stoplist**: English
- **Length Low**: 70 characters (minimum paragraph length)
- **Length High**: 200 characters (threshold for short paragraphs)
- **Stopwords Low**: 0.30 (minimum stopword density)
- **Stopwords High**: 0.32 (maximum stopword density)
- **Max Link Density**: 0.2 (maximum ratio of link text)
- **Max Heading Distance**: 200 (maximum distance from heading)

## Dependencies

- **puppeteer**: Headless Chrome browser automation
- **@smodin/justext**: Text extraction and boilerplate removal

## Security Note

The `@smodin/justext` package has dependencies with known vulnerabilities (axios and string). These vulnerabilities are primarily related to SSRF and DoS attacks. For the use case of crawling public Wikipedia pages, the risk is minimal, but be aware if using this crawler in production environments or with untrusted URLs.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

