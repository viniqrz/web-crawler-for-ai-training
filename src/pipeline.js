import { francAll } from 'franc-min';

/**
 * DataPipeline - A C4-like data processing pipeline for cleaning and filtering
 * raw content from the web crawler. Implements heuristics-based quality filtering,
 * language identification, and n-gram deduplication.
 */
class DataPipeline {
  constructor(options = {}) {
    this.options = {
      // Language filtering
      targetLanguages: options.targetLanguages || ['eng'], // ISO 639-3 codes
      minLanguageConfidence: options.minLanguageConfidence || 0.5,
      
      // Quality filtering heuristics
      minTextLength: options.minTextLength || 100,
      maxTextLength: options.maxTextLength || 100000,
      minWordCount: options.minWordCount || 20,
      minAvgWordLength: options.minAvgWordLength || 3,
      maxAvgWordLength: options.maxAvgWordLength || 15,
      
      // Line-based filtering (similar to C4)
      minLinesEndingWithPunctuation: options.minLinesEndingWithPunctuation || 0.5,
      maxBulletPointRatio: options.maxBulletPointRatio || 0.5,
      maxEllipsisLineRatio: options.maxEllipsisLineRatio || 0.3,
      
      // Symbol and special character filtering
      maxSymbolToWordRatio: options.maxSymbolToWordRatio || 0.1,
      maxDigitRatio: options.maxDigitRatio || 0.15,
      maxUppercaseRatio: options.maxUppercaseRatio || 0.2,
      
      // Content quality heuristics
      minUniqueWordsRatio: options.minUniqueWordsRatio || 0.3,
      maxRepetitiveNGramRatio: options.maxRepetitiveNGramRatio || 0.15,
      
      // N-gram settings for deduplication
      ngramSize: options.ngramSize || 13,
      ngramOverlapThreshold: options.ngramOverlapThreshold || 0.8,
      
      ...options
    };
    
    // Store n-grams for deduplication across documents
    this.seenNGrams = new Set();
    this.processedDocuments = 0;
  }

  /**
   * Process a single document through the pipeline
   * @param {Object} document - Document object with text content
   * @returns {Object} - Processed document with filtering metadata
   */
  async processDocument(document) {
    const result = {
      ...document,
      pipeline: {
        passed: true,
        filters: {},
        metrics: {}
      }
    };

    // Extract text content
    const text = document.filteredText || document.text || '';
    
    if (!text) {
      result.pipeline.passed = false;
      result.pipeline.filters.emptyText = true;
      return result;
    }

    // 1. Language identification
    const languageCheck = this.identifyLanguage(text);
    result.pipeline.metrics.language = languageCheck;
    result.pipeline.filters.language = !languageCheck.passed;
    
    if (!languageCheck.passed) {
      result.pipeline.passed = false;
      return result;
    }

    // 2. Calculate quality metrics
    const metrics = this.calculateMetrics(text);
    result.pipeline.metrics = { ...result.pipeline.metrics, ...metrics };

    // 3. Apply quality filters
    const qualityFilters = this.applyQualityFilters(text, metrics);
    result.pipeline.filters = { ...result.pipeline.filters, ...qualityFilters };
    
    if (Object.values(qualityFilters).some(v => v === true)) {
      result.pipeline.passed = false;
      return result;
    }

    // 4. Check for n-gram duplicates
    const duplicateCheck = this.checkDuplicates(text);
    result.pipeline.metrics.ngramDuplication = duplicateCheck;
    result.pipeline.filters.duplicate = !duplicateCheck.passed;
    
    if (!duplicateCheck.passed) {
      result.pipeline.passed = false;
      return result;
    }

    // If all checks passed, add n-grams to seen set
    this.addNGrams(text);
    this.processedDocuments++;

    return result;
  }

  /**
   * Process multiple documents through the pipeline
   * @param {Array<Object>} documents - Array of document objects
   * @returns {Object} - Processing results with statistics
   */
  async processBatch(documents) {
    const results = [];
    const stats = {
      total: documents.length,
      passed: 0,
      failed: 0,
      failureReasons: {}
    };

    for (const doc of documents) {
      const result = await this.processDocument(doc);
      results.push(result);

      if (result.pipeline.passed) {
        stats.passed++;
      } else {
        stats.failed++;
        
        // Count failure reasons
        for (const [filter, failed] of Object.entries(result.pipeline.filters)) {
          if (failed) {
            stats.failureReasons[filter] = (stats.failureReasons[filter] || 0) + 1;
          }
        }
      }
    }

    return {
      results,
      stats,
      passRate: stats.total > 0 ? stats.passed / stats.total : 0
    };
  }

  /**
   * Identify the language of the text
   * @param {string} text - Text to analyze
   * @returns {Object} - Language identification result
   */
  identifyLanguage(text) {
    try {
      // Use franc to detect language
      const languages = francAll(text, { minLength: 10 });
      
      if (!languages || languages.length === 0 || languages[0][0] === 'und') {
        return {
          passed: false,
          detected: 'undetermined',
          confidence: 0,
          reason: 'Could not determine language'
        };
      }

      const [detectedLang, confidence] = languages[0];
      
      const passed = this.options.targetLanguages.includes(detectedLang) &&
                    confidence >= this.options.minLanguageConfidence;

      return {
        passed,
        detected: detectedLang,
        confidence: confidence,
        allDetections: languages.slice(0, 3).map(([lang, conf]) => ({
          language: lang,
          confidence: conf
        })),
        reason: !passed ? `Language ${detectedLang} not in target languages or low confidence (${confidence.toFixed(2)})` : null
      };
    } catch (error) {
      return {
        passed: false,
        detected: 'error',
        confidence: 0,
        reason: `Language detection error: ${error.message}`
      };
    }
  }

  /**
   * Calculate various text quality metrics
   * @param {string} text - Text to analyze
   * @returns {Object} - Calculated metrics
   */
  calculateMetrics(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    
    // Character counts
    const totalChars = text.length;
    const alphaChars = (text.match(/[a-zA-Z]/g) || []).length;
    const digitChars = (text.match(/\d/g) || []).length;
    const uppercaseChars = (text.match(/[A-Z]/g) || []).length;
    const whitespaceChars = (text.match(/\s/g) || []).length;
    const symbolChars = totalChars - alphaChars - digitChars - whitespaceChars;

    // Line analysis
    const linesEndingWithPunctuation = lines.filter(line => 
      /[.!?]$/.test(line.trim())
    ).length;
    
    const bulletLines = lines.filter(line => 
      /^[\s]*[-•*▪▫◦◘◙○●]/.test(line)
    ).length;
    
    const ellipsisLines = lines.filter(line => 
      /\.{2,}/.test(line)
    ).length;

    // Word analysis
    const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
    const avgWordLength = words.length > 0 ? totalWordLength / words.length : 0;

    return {
      textLength: totalChars,
      wordCount: words.length,
      uniqueWordCount: uniqueWords.size,
      lineCount: lines.length,
      avgWordLength,
      uniqueWordsRatio: words.length > 0 ? uniqueWords.size / words.length : 0,
      digitRatio: totalChars > 0 ? digitChars / totalChars : 0,
      uppercaseRatio: alphaChars > 0 ? uppercaseChars / alphaChars : 0,
      symbolToWordRatio: words.length > 0 ? symbolChars / words.length : 0,
      linesEndingWithPunctuationRatio: lines.length > 0 ? linesEndingWithPunctuation / lines.length : 0,
      bulletPointRatio: lines.length > 0 ? bulletLines / lines.length : 0,
      ellipsisLineRatio: lines.length > 0 ? ellipsisLines / lines.length : 0
    };
  }

  /**
   * Apply quality filters based on calculated metrics
   * @param {string} text - Text being analyzed
   * @param {Object} metrics - Calculated metrics
   * @returns {Object} - Filter results (true means failed the filter)
   */
  applyQualityFilters(text, metrics) {
    return {
      tooShort: metrics.textLength < this.options.minTextLength,
      tooLong: metrics.textLength > this.options.maxTextLength,
      tooFewWords: metrics.wordCount < this.options.minWordCount,
      wordsTooShort: metrics.avgWordLength < this.options.minAvgWordLength,
      wordsTooLong: metrics.avgWordLength > this.options.maxAvgWordLength,
      insufficientPunctuation: metrics.linesEndingWithPunctuationRatio < this.options.minLinesEndingWithPunctuation,
      tooManyBullets: metrics.bulletPointRatio > this.options.maxBulletPointRatio,
      tooManyEllipsis: metrics.ellipsisLineRatio > this.options.maxEllipsisLineRatio,
      tooManySymbols: metrics.symbolToWordRatio > this.options.maxSymbolToWordRatio,
      tooManyDigits: metrics.digitRatio > this.options.maxDigitRatio,
      tooManyUppercase: metrics.uppercaseRatio > this.options.maxUppercaseRatio,
      insufficientVariety: metrics.uniqueWordsRatio < this.options.minUniqueWordsRatio
    };
  }

  /**
   * Generate n-grams from text
   * @param {string} text - Text to process
   * @param {number} n - N-gram size
   * @returns {Array<string>} - Array of n-grams
   */
  generateNGrams(text, n = null) {
    const ngramSize = n || this.options.ngramSize;
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const ngrams = [];
    
    for (let i = 0; i <= words.length - ngramSize; i++) {
      const ngram = words.slice(i, i + ngramSize).join(' ');
      ngrams.push(ngram);
    }
    
    return ngrams;
  }

  /**
   * Check for duplicate content using n-grams
   * @param {string} text - Text to check
   * @returns {Object} - Duplication check result
   */
  checkDuplicates(text) {
    const ngrams = this.generateNGrams(text);
    
    if (ngrams.length === 0) {
      return {
        passed: true,
        overlapRatio: 0,
        reason: null
      };
    }

    // Count how many n-grams have been seen before
    const seenCount = ngrams.filter(ngram => this.seenNGrams.has(ngram)).length;
    const overlapRatio = seenCount / ngrams.length;
    
    const passed = overlapRatio < this.options.ngramOverlapThreshold;

    return {
      passed,
      overlapRatio,
      totalNGrams: ngrams.length,
      duplicateNGrams: seenCount,
      reason: !passed ? `High n-gram overlap ratio: ${(overlapRatio * 100).toFixed(1)}%` : null
    };
  }

  /**
   * Add n-grams from text to the seen set
   * @param {string} text - Text to process
   */
  addNGrams(text) {
    const ngrams = this.generateNGrams(text);
    ngrams.forEach(ngram => this.seenNGrams.add(ngram));
  }

  /**
   * Reset the pipeline state (clear seen n-grams)
   */
  reset() {
    this.seenNGrams.clear();
    this.processedDocuments = 0;
  }

  /**
   * Get pipeline statistics
   * @returns {Object} - Pipeline statistics
   */
  getStats() {
    return {
      processedDocuments: this.processedDocuments,
      uniqueNGrams: this.seenNGrams.size,
      memoryUsage: {
        ngramSetSize: this.seenNGrams.size,
        estimatedMB: (this.seenNGrams.size * 100) / (1024 * 1024) // Rough estimate
      }
    };
  }

  /**
   * Export filtered documents only
   * @param {Array<Object>} processedResults - Results from processBatch
   * @returns {Array<Object>} - Only documents that passed filters
   */
  exportFiltered(processedResults) {
    return processedResults
      .filter(doc => doc.pipeline.passed)
      .map(doc => {
        // Create a clean copy without pipeline metadata if desired
        const { pipeline, ...cleanDoc } = doc;
        return cleanDoc;
      });
  }
}

export default DataPipeline;
