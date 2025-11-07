# Web Crawler for AI Training

A Puppeteer-based web crawler designed to gather Wikipedia pages data and filter text content using jusText. This tool extracts clean, main content from Wikipedia pages while removing boilerplate content like navigation links, headers, and footers.

## Features

- 🤖 **Puppeteer-powered**: Headless browser crawling with full JavaScript support
- 📄 **jusText Integration**: Intelligent text extraction that filters out boilerplate content
- 🌐 **Wikipedia Optimized**: Specifically designed for crawling Wikipedia pages
- 🔗 **Link Extraction**: Extract all Wikipedia links from any page
- 🔄 **Recursive Crawling**: Follow links recursively with configurable depth and page limits
- 📊 **URL Tree Visualization**: Generate markdown tree diagrams of crawled page relationships
- 💾 **Data Export**: Save crawled data in structured JSON format
- ⚡ **Multiple Pages**: Support for crawling multiple Wikipedia URLs
- 🎯 **Clean Content**: Extracts only the main article content for AI training purposes
- 🔍 **C4-like Data Pipeline**: Quality filtering with language identification, heuristics-based filtering, and n-gram deduplication

## Installation

```bash
# Clone the repository
git clone https://github.com/viniqrz/web-crawler-for-ai-training.git
cd web-crawler-for-ai-training

# Install dependencies
npm install

# Optional: Set Chrome path if needed
export CHROME_PATH=/path/to/chrome  # Linux/Mac
# or on Windows: set CHROME_PATH=C:\Path\To\chrome.exe
```

## Usage

### Quick Start

Run the default example to crawl three AI-related Wikipedia pages:

```bash
npm start
```

This will:
1. Crawl Wikipedia pages for Artificial Intelligence, Machine Learning, and Natural Language Processing
2. Extract and filter the main content using jusText
3. Save results to `output/wikipedia_crawl_results.json`

### Examples

The repository includes several examples demonstrating different use cases:

#### 1. Simple Example
Crawl a single Wikipedia page:

```bash
node examples/simple.js
```

#### 2. Custom Configuration
Use custom settings and output directory:

```bash
node examples/custom-config.js
```

#### 3. Advanced Example
Batch process multiple pages with detailed analytics:

```bash
node examples/advanced.js
```

#### 4. Link Extraction Example
Extract all Wikipedia links from a page:

```bash
node examples/link-extraction.js
```

#### 5. Recursive Crawl Example
Recursively crawl Wikipedia pages up to a specified limit (up to 100 pages):

```bash
node examples/recursive-crawl.js
```

This example demonstrates:
- Recursive crawling with depth and page limits
- Automatic link extraction and following
- URL tree visualization in markdown format
- Progress tracking and statistics

#### 6. Data Pipeline Example
Process crawled content with C4-like quality filtering:

```bash
node examples/pipeline-example.js
```

This example demonstrates:
- Language identification for filtering non-English content
- Quality heuristics (text length, word count, punctuation ratio, etc.)
- N-gram based deduplication to remove repetitive content
- Statistical analysis and filtering metrics
- Exporting both filtered and unfiltered results

#### 7. Standalone Example
A simpler standalone example:

```bash
node example.js
```

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

// Extract links from a page
const links = await crawler.getWikipediaLinks('https://en.wikipedia.org/wiki/Machine_learning');
console.log(`Found ${links.length} links`);

// Recursive crawling
const recursiveResult = await crawler.crawlRecursive(
  'https://en.wikipedia.org/wiki/Artificial_intelligence',
  { maxPages: 100, maxDepth: 3 }
);

// Save results
await crawler.saveToFile(results, 'my_results.json');
await crawler.saveTreeToMarkdown(recursiveResult.linkTree, 'url_tree.md');

await crawler.close();
```

#### Using the Data Pipeline

Process crawled content with C4-like quality filtering:

```javascript
import WikipediaCrawler from './src/crawler.js';
import DataPipeline from './src/pipeline.js';

const crawler = new WikipediaCrawler({ headless: true });
const pipeline = new DataPipeline({
  targetLanguages: ['eng'],
  minTextLength: 100,
  ngramSize: 13
});

await crawler.init();

// Crawl pages
const crawledData = await crawler.crawlMultiple(urls);

// Process through pipeline
const pipelineResults = await pipeline.processBatch(crawledData);

console.log(`Passed: ${pipelineResults.stats.passed}/${pipelineResults.stats.total}`);

// Export only filtered (quality-approved) documents
const filteredDocs = pipeline.exportFiltered(pipelineResults.results);
await crawler.saveToFile(filteredDocs, 'filtered_results.json');

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

##### `async getWikipediaLinks(url)`
Extract all Wikipedia article links from a page.

**Parameters:**
- `url` (string): The Wikipedia page URL to extract links from

**Returns:** Array of Wikipedia article URLs found on the page (Array<string>)

##### `async crawlRecursive(startUrl, options)`
Recursively crawl Wikipedia pages following links.

**Parameters:**
- `startUrl` (string): The starting Wikipedia page URL
- `options` (Object): Options for recursive crawling
  - `maxPages` (number): Maximum number of pages to crawl. Default: `100`
  - `maxDepth` (number): Maximum depth to crawl. Default: `3`

**Returns:** Object containing:
- `crawledData`: Array of crawled page data
- `linkTree`: Tree structure of URLs and their relationships
- `totalPages`: Total number of unique pages visited
- `visitedUrls`: Array of all visited URLs

##### `async saveToFile(data, filename)`
Save crawled data to a JSON file.

**Parameters:**
- `data` (Object|Array): The data to save
- `filename` (string): Output filename. Default: `'crawled_data.json'`

##### `async saveTreeToMarkdown(linkTree, filename)`
Save the link tree as a markdown file with tree visualization.

**Parameters:**
- `linkTree` (Object): The link tree object from `crawlRecursive()`
- `filename` (string): Output filename. Default: `'url_tree.md'`

##### `async close()`
Close the browser and cleanup resources.

### DataPipeline Class

A C4-like data processing pipeline for quality filtering, language identification, and deduplication of crawled content.

#### Constructor Options

- `targetLanguages` (Array<string>): ISO 639-3 language codes to accept. Default: `['eng']`
- `minLanguageConfidence` (number): Minimum confidence for language detection (0-1). Default: `0.5`
- `minTextLength` (number): Minimum text length in characters. Default: `100`
- `maxTextLength` (number): Maximum text length in characters. Default: `100000`
- `minWordCount` (number): Minimum word count. Default: `20`
- `minAvgWordLength` (number): Minimum average word length. Default: `3`
- `maxAvgWordLength` (number): Maximum average word length. Default: `15`
- `minLinesEndingWithPunctuation` (number): Minimum ratio of lines ending with punctuation. Default: `0.5`
- `maxBulletPointRatio` (number): Maximum ratio of bullet-point lines. Default: `0.5`
- `maxEllipsisLineRatio` (number): Maximum ratio of lines with ellipsis. Default: `0.3`
- `maxSymbolToWordRatio` (number): Maximum ratio of symbols to words. Default: `0.1`
- `maxDigitRatio` (number): Maximum ratio of digits in text. Default: `0.15`
- `maxUppercaseRatio` (number): Maximum ratio of uppercase letters. Default: `0.2`
- `minUniqueWordsRatio` (number): Minimum ratio of unique words. Default: `0.3`
- `ngramSize` (number): N-gram size for deduplication. Default: `13`
- `ngramOverlapThreshold` (number): Maximum n-gram overlap ratio for duplicates. Default: `0.8`

#### Methods

##### `async processDocument(document)`
Process a single document through the quality filtering pipeline.

**Parameters:**
- `document` (Object): Document object with `filteredText` or `text` property

**Returns:** Object containing:
- Original document properties
- `pipeline.passed` (boolean): Whether document passed all filters
- `pipeline.filters` (Object): Results of each filter check
- `pipeline.metrics` (Object): Calculated quality metrics

##### `async processBatch(documents)`
Process multiple documents through the pipeline.

**Parameters:**
- `documents` (Array<Object>): Array of document objects

**Returns:** Object containing:
- `results` (Array): Processed documents with pipeline metadata
- `stats` (Object): Processing statistics including pass/fail counts and failure reasons
- `passRate` (number): Ratio of documents that passed (0-1)

##### `identifyLanguage(text)`
Identify the language of text content.

**Parameters:**
- `text` (string): Text to analyze

**Returns:** Object with language detection results

##### `calculateMetrics(text)`
Calculate various text quality metrics.

**Parameters:**
- `text` (string): Text to analyze

**Returns:** Object with metrics like word count, text length, ratios, etc.

##### `generateNGrams(text, n)`
Generate n-grams from text for deduplication.

**Parameters:**
- `text` (string): Text to process
- `n` (number): N-gram size (optional, uses constructor option if not provided)

**Returns:** Array of n-gram strings

##### `exportFiltered(processedResults)`
Export only documents that passed all filters.

**Parameters:**
- `processedResults` (Array): Results from `processBatch()`

**Returns:** Array of clean documents (without pipeline metadata)

##### `reset()`
Reset the pipeline state, clearing stored n-grams.

##### `getStats()`
Get pipeline statistics including processed document count and memory usage.
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

## Configuration

You can customize the crawler behavior using the `config.json` file:

```json
{
  "crawler": {
    "headless": true,
    "outputDir": "./output",
    "executablePath": null
  },
  "justext": {
    "language": "English",
    "lengthLow": 70,
    "lengthHigh": 200,
    "stopwordsLow": 0.30,
    "stopwordsHigh": 0.32,
    "maxLinkDensity": 0.2,
    "maxHeadingDistance": 200
  },
  "crawling": {
    "delayBetweenRequests": 1000,
    "timeout": 30000
  },
  "pipeline": {
    "targetLanguages": ["eng"],
    "minLanguageConfidence": 0.5,
    "minTextLength": 100,
    "maxTextLength": 100000,
    "minWordCount": 20,
    "ngramSize": 13,
    "ngramOverlapThreshold": 0.8
  }
}
```

### Configuration Options

#### Crawler Options
- `headless`: Run browser in headless mode (default: `true`)
- `outputDir`: Directory for output files (default: `./output`)
- `executablePath`: Path to Chrome/Chromium executable (default: `null`, uses bundled Chromium or `CHROME_PATH` environment variable)

#### Environment Variables
- `CHROME_PATH`: Optional path to Chrome/Chromium executable (used by test scripts and can be used in custom implementations)

#### jusText Options
- `language`: Stoplist language for text filtering (default: `'English'`)
- `lengthLow`: Minimum paragraph length in characters (default: `70`)
- `lengthHigh`: Threshold for short paragraphs (default: `200`)
- `stopwordsLow`: Minimum stopword density (default: `0.30`)
- `stopwordsHigh`: Maximum stopword density (default: `0.32`)
- `maxLinkDensity`: Maximum ratio of link text (default: `0.2`)
- `maxHeadingDistance`: Maximum distance from heading (default: `200`)

#### Crawling Options
- `delayBetweenRequests`: Delay in milliseconds between page requests (default: `1000`)
- `timeout`: Page load timeout in milliseconds (default: `30000`)

#### Data Pipeline Options
- `targetLanguages`: Array of ISO 639-3 language codes to accept (default: `['eng']`)
- `minLanguageConfidence`: Minimum confidence for language detection 0-1 (default: `0.5`)
- `minTextLength`: Minimum text length in characters (default: `100`)
- `maxTextLength`: Maximum text length in characters (default: `100000`)
- `minWordCount`: Minimum word count (default: `20`)
- `minAvgWordLength`: Minimum average word length (default: `3`)
- `maxAvgWordLength`: Maximum average word length (default: `15`)
- `minLinesEndingWithPunctuation`: Minimum ratio of lines ending with punctuation (default: `0.5`)
- `maxBulletPointRatio`: Maximum ratio of bullet-point lines (default: `0.5`)
- `maxEllipsisLineRatio`: Maximum ratio of lines with ellipsis (default: `0.3`)
- `maxSymbolToWordRatio`: Maximum ratio of symbols to words (default: `0.1`)
- `maxDigitRatio`: Maximum ratio of digits in text (default: `0.15`)
- `maxUppercaseRatio`: Maximum ratio of uppercase letters (default: `0.2`)
- `minUniqueWordsRatio`: Minimum ratio of unique words (default: `0.3`)
- `ngramSize`: N-gram size for deduplication (default: `13`)
- `ngramOverlapThreshold`: Maximum n-gram overlap ratio for duplicates (default: `0.8`)

## How It Works

1. **Puppeteer Navigation**: The crawler uses Puppeteer to navigate to Wikipedia pages with full JavaScript support
2. **HTML Extraction**: Retrieves the complete HTML content of the page
3. **jusText Filtering**: Applies the jusText algorithm to:
   - Identify and extract main content paragraphs
   - Remove navigation, headers, footers, and other boilerplate
   - Filter based on text density, stopword analysis, and link density
4. **Data Structuring**: Organizes extracted content with metadata
5. **Data Pipeline (Optional)**: Process content through C4-like quality filters:
   - **Language Identification**: Detect and filter by language using statistical analysis
   - **Quality Heuristics**: Apply multiple text quality filters (length, word count, punctuation, etc.)
   - **N-gram Deduplication**: Remove duplicate or near-duplicate content using 13-word n-grams
   - **Statistical Analysis**: Generate detailed metrics and filtering reports
6. **Export**: Saves results in JSON format for easy consumption by AI training pipelines

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
- **franc-min**: Language identification for quality filtering

## Security Note

The `@smodin/justext` package has dependencies with known vulnerabilities (axios and string). These vulnerabilities are primarily related to SSRF and DoS attacks. For the use case of crawling public Wikipedia pages, the risk is minimal, but be aware if using this crawler in production environments or with untrusted URLs.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

