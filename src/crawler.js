import puppeteer from 'puppeteer';
import { rawHtml } from '@smodin/justext';
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
      // Try to use system Chrome if Puppeteer's Chrome is not available
      const launchOptions = {
        headless: this.options.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      };
      
      // If executablePath is provided in options, use it
      if (this.options.executablePath) {
        launchOptions.executablePath = this.options.executablePath;
      }
      
      this.browser = await puppeteer.launch(launchOptions);
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
   * Get all Wikipedia links from a page
   * @param {string} url - The Wikipedia page URL to extract links from
   * @returns {Array<string>} - Array of Wikipedia article URLs found on the page
   */
  async getWikipediaLinks(url) {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser.newPage();
    
    try {
      console.log(`Extracting links from: ${url}`);
      
      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Extract Wikipedia article links from the page
      const links = await page.evaluate(() => {
        const linkElements = document.querySelectorAll('#mw-content-text a[href^="/wiki/"]');
        const urls = new Set();
        
        linkElements.forEach(link => {
          const href = link.getAttribute('href');
          // Filter out special pages, files, and other non-article pages
          if (href && 
              !href.includes(':') && 
              !href.includes('#') &&
              !href.startsWith('/wiki/Special:') &&
              !href.startsWith('/wiki/File:') &&
              !href.startsWith('/wiki/Wikipedia:') &&
              !href.startsWith('/wiki/Help:') &&
              !href.startsWith('/wiki/Template:') &&
              !href.startsWith('/wiki/Category:') &&
              !href.startsWith('/wiki/Portal:') &&
              !href.startsWith('/wiki/Talk:')) {
            // Convert relative URLs to absolute
            const fullUrl = `https://en.wikipedia.org${href}`;
            urls.add(fullUrl);
          }
        });
        
        return Array.from(urls);
      });

      console.log(`Found ${links.length} Wikipedia links`);
      return links;
      
    } catch (error) {
      console.error(`Error extracting links from ${url}:`, error.message);
      return [];
    } finally {
      await page.close();
    }
  }

  /**
   * Recursively crawl Wikipedia pages following links
   * @param {string} startUrl - The starting Wikipedia page URL
   * @param {Object} options - Options for recursive crawling
   * @param {number} options.maxPages - Maximum number of pages to crawl (default: 100)
   * @param {number} options.maxDepth - Maximum depth to crawl (default: 3)
   * @returns {Object} - Object containing crawl results and link tree
   */
  async crawlRecursive(startUrl, options = {}) {
    const maxPages = options.maxPages || 100;
    const maxDepth = options.maxDepth || 3;
    
    const visited = new Set();
    const crawledData = [];
    const linkTree = { url: startUrl, title: '', children: [], depth: 0 };
    
    const crawlHelper = async (url, depth, parentNode) => {
      // Stop if we've reached the limits
      if (visited.size >= maxPages || depth > maxDepth || visited.has(url)) {
        return;
      }
      
      visited.add(url);
      
      try {
        // Crawl the current page
        const pageData = await this.crawlPage(url);
        crawledData.push(pageData);
        
        // Update tree node
        if (parentNode) {
          parentNode.title = pageData.title;
        }
        
        // If we haven't reached max depth or max pages, get links
        if (depth < maxDepth && visited.size < maxPages) {
          const links = await this.getWikipediaLinks(url);
          
          // Crawl a subset of links to avoid exponential growth
          const linksToFollow = links.slice(0, Math.min(5, maxPages - visited.size));
          
          for (const link of linksToFollow) {
            if (visited.size >= maxPages) break;
            if (visited.has(link)) continue;
            
            // Add child node to tree
            const childNode = { url: link, title: '', children: [], depth: depth + 1 };
            if (parentNode) {
              parentNode.children.push(childNode);
            }
            
            // Recursively crawl
            await crawlHelper(link, depth + 1, childNode);
            
            // Small delay between requests
            await this.delay(1000);
          }
        }
      } catch (error) {
        console.error(`Error in recursive crawl of ${url}:`, error.message);
      }
    };
    
    await crawlHelper(startUrl, 0, linkTree);
    
    return {
      crawledData,
      linkTree,
      totalPages: visited.size,
      visitedUrls: Array.from(visited)
    };
  }

  /**
   * Filter HTML content using jusText to extract main text content
   * @param {string} html - The HTML content to filter
   * @returns {string} - The filtered text content
   */
  async filterTextWithJusText(html) {
    try {
      // jusText extracts the main content and removes boilerplate
      // rawHtml function signature: rawHtml(htmlText, language, format, options)
      const paragraphs = rawHtml(html, 'English', 'unformatted', {
        lengthLow: 70,       // Minimum length for a paragraph
        lengthHigh: 200,     // Maximum length for short paragraphs
        stopwordsLow: 0.30,  // Minimum stopwords density
        stopwordsHigh: 0.32, // Maximum stopwords density
        maxLinkDensity: 0.2, // Maximum link density
        maxHeadingDistance: 200 // Maximum heading distance
      });

      // Filter for good and neargood paragraphs and join with double newlines
      const text = paragraphs
        .filter(p => p.classType === 'good' || p.classType === 'neargood')
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
   * Generate a markdown tree visualization from a link tree
   * @param {Object} linkTree - The link tree object
   * @param {string} prefix - Current line prefix for tree structure
   * @param {boolean} isLast - Whether this is the last child
   * @returns {string} - Markdown formatted tree
   */
  generateMarkdownTree(linkTree, prefix = '', isLast = true) {
    let result = '';
    
    if (linkTree.depth === 0) {
      // Root node
      result += `# Wikipedia URL Tree\n\n`;
      result += `**Root:** [${linkTree.title || 'Starting Page'}](${linkTree.url})\n\n`;
      result += `\`\`\`\n`;
      result += `${linkTree.title || linkTree.url}\n`;
    } else {
      // Child nodes
      const connector = isLast ? '└── ' : '├── ';
      const title = linkTree.title || linkTree.url.split('/').pop();
      result += `${prefix}${connector}${title}\n`;
    }
    
    // Process children
    if (linkTree.children && linkTree.children.length > 0) {
      linkTree.children.forEach((child, index) => {
        const isLastChild = index === linkTree.children.length - 1;
        const childPrefix = linkTree.depth === 0 
          ? '' 
          : prefix + (isLast ? '    ' : '│   ');
        result += this.generateMarkdownTree(child, childPrefix, isLastChild);
      });
    }
    
    if (linkTree.depth === 0) {
      result += '```\n\n';
      result += `## Tree Statistics\n\n`;
      result += `- **Total Pages:** ${this.countTreeNodes(linkTree)}\n`;
      result += `- **Max Depth:** ${this.getMaxDepth(linkTree)}\n`;
    }
    
    return result;
  }

  /**
   * Count total nodes in the tree
   * @param {Object} node - Tree node
   * @returns {number} - Total count of nodes
   */
  countTreeNodes(node) {
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
        count += this.countTreeNodes(child);
      });
    }
    return count;
  }

  /**
   * Get maximum depth of the tree
   * @param {Object} node - Tree node
   * @returns {number} - Maximum depth
   */
  getMaxDepth(node) {
    if (!node.children || node.children.length === 0) {
      return node.depth;
    }
    return Math.max(...node.children.map(child => this.getMaxDepth(child)));
  }

  /**
   * Save the link tree as a markdown file
   * @param {Object} linkTree - The link tree object
   * @param {string} filename - The output filename
   */
  async saveTreeToMarkdown(linkTree, filename = 'url_tree.md') {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.options.outputDir, { recursive: true });
      
      const markdown = this.generateMarkdownTree(linkTree);
      const filepath = path.join(this.options.outputDir, filename);
      await fs.writeFile(filepath, markdown, 'utf-8');
      
      console.log(`Tree visualization saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error saving tree markdown:', error.message);
      throw error;
    }
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
