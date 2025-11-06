import puppeteer from 'puppeteer';
import jusText from '@smodin/justext';
import fs from 'fs/promises';
import path from 'path';

/**
 * WikipediaCrawler - A web crawler for gathering Wikipedia pages data
 * and filtering text content using jusText
 */
class WikipediaCrawler {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false,
      outputDir: options.outputDir || './output',
      ...options
    };
    this.browser = null;
  }

  /**
   * Initialize the browser instance
   */
  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('Browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error.message);
      throw error;
    }
  }

  /**
   * Crawl a Wikipedia page and extract filtered text content
   * @param {string} url - The Wikipedia page URL to crawl
   * @returns {Object} - Object containing the page data and filtered text
   */
  async crawlPage(url) {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser.newPage();
    
    try {
      console.log(`Crawling: ${url}`);
      
      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Get page title
      const title = await page.title();
      
      // Get the HTML content
      const html = await page.content();
      
      // Use jusText to extract and filter text content
      const filteredText = await this.filterTextWithJusText(html);
      
      // Get additional metadata
      const metadata = await page.evaluate(() => {
        return {
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
      });

      const result = {
        title,
        url: metadata.url,
        timestamp: metadata.timestamp,
        filteredText,
        rawTextLength: filteredText.length
      };

      console.log(`Successfully crawled: ${title}`);
      return result;
      
    } catch (error) {
      console.error(`Error crawling ${url}:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Filter HTML content using jusText to extract main text content
   * @param {string} html - The HTML content to filter
   * @returns {string} - The filtered text content
   */
  async filterTextWithJusText(html) {
    try {
      // jusText extracts the main content and removes boilerplate
      const paragraphs = await jusText(html, {
        stoplist: 'English', // Use English stoplist
        lengthLow: 70,       // Minimum length for a paragraph
        lengthHigh: 200,     // Maximum length for short paragraphs
        stopwordsLow: 0.30,  // Minimum stopwords density
        stopwordsHigh: 0.32, // Maximum stopwords density
        maxLinkDensity: 0.2, // Maximum link density
        maxHeadingDistance: 200 // Maximum heading distance
      });

      // Join paragraphs with double newlines
      const text = paragraphs
        .filter(p => p.class === 'good' || p.class === 'neargood')
        .map(p => p.text)
        .join('\n\n');

      return text;
    } catch (error) {
      console.error('Error filtering text with jusText:', error.message);
      // Fallback: return empty string if jusText fails
      return '';
    }
  }

  /**
   * Crawl multiple Wikipedia pages
   * @param {Array<string>} urls - Array of Wikipedia page URLs
   * @returns {Array<Object>} - Array of crawled page data
   */
  async crawlMultiple(urls) {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.crawlPage(url);
        results.push(result);
        
        // Small delay between requests to be respectful
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to crawl ${url}:`, error.message);
        results.push({
          url,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  /**
   * Save crawled data to a JSON file
   * @param {Object|Array} data - The data to save
   * @param {string} filename - The output filename
   */
  async saveToFile(data, filename = 'crawled_data.json') {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.options.outputDir, { recursive: true });
      
      const filepath = path.join(this.options.outputDir, filename);
      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
      
      console.log(`Data saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error saving file:', error.message);
      throw error;
    }
  }

  /**
   * Utility function to add delay
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close the browser and cleanup
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed');
    }
  }
}

export default WikipediaCrawler;
