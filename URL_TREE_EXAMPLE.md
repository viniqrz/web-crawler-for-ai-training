# Wikipedia URL Tree - Example Output

This is an example of what the URL tree visualization looks like when using the `crawlRecursive()` function.

**Root:** [Artificial intelligence - Wikipedia](https://en.wikipedia.org/wiki/Artificial_intelligence)

```
Artificial intelligence - Wikipedia
├── Machine learning
│   ├── Deep learning
│   │   ├── Neural network
│   │   ├── Convolutional neural network
│   │   └── Recurrent neural network
│   ├── Supervised learning
│   │   ├── Classification
│   │   └── Regression analysis
│   ├── Unsupervised learning
│   │   ├── Cluster analysis
│   │   └── Dimensionality reduction
│   ├── Reinforcement learning
│   │   ├── Q-learning
│   │   └── Markov decision process
│   └── Feature engineering
├── Natural language processing
│   ├── Transformer (machine learning model)
│   │   ├── BERT (language model)
│   │   ├── GPT-3
│   │   └── Attention mechanism
│   ├── Named entity recognition
│   ├── Sentiment analysis
│   ├── Machine translation
│   └── Word embedding
├── Computer vision
│   ├── Image recognition
│   │   ├── Facial recognition system
│   │   └── Optical character recognition
│   ├── Object detection
│   ├── Image segmentation
│   └── Feature detection
├── Expert system
│   ├── Knowledge base
│   ├── Inference engine
│   └── Forward chaining
└── Robotics
    ├── Robot
    ├── Autonomous robot
    ├── Mobile robot
    └── Industrial robot
```

## Tree Statistics

- **Total Pages:** 45
- **Max Depth:** 3

## How to Generate This

Run the recursive crawl example:

```bash
node examples/recursive-crawl.js
```

The tree visualization will be automatically saved to `output/url_tree_[timestamp].md` along with the crawled data.

## Customizing the Crawl

You can customize the recursive crawl by adjusting the options:

```javascript
const result = await crawler.crawlRecursive(startUrl, {
  maxPages: 100,    // Maximum number of pages to crawl
  maxDepth: 3       // Maximum depth to follow links
});
```

- **maxPages**: Controls how many total pages will be crawled (default: 100)
- **maxDepth**: Controls how many levels deep the crawler will follow links (default: 3)

## Understanding the Tree

- The **root** is the starting URL you provide
- **Children** are Wikipedia links found on parent pages
- **Depth** indicates how many links away from the root a page is
- The crawler automatically filters out non-article pages (Special:, File:, Talk:, etc.)
- Only up to 5 links per page are followed to prevent exponential growth
