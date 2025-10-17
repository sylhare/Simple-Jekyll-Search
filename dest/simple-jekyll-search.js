(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.SimpleJekyllSearch = {}));
})(this, function(exports2) {
  "use strict";
  function load(location, callback) {
    const xhr = getXHR();
    xhr.open("GET", location, true);
    xhr.onreadystatechange = createStateChangeListener(xhr, callback);
    xhr.send();
  }
  function createStateChangeListener(xhr, callback) {
    return function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          callback(null, JSON.parse(xhr.responseText));
        } catch (err) {
          callback(err instanceof Error ? err : new Error(String(err)), null);
        }
      }
    };
  }
  function getXHR() {
    return window.XMLHttpRequest ? new window.XMLHttpRequest() : new window.ActiveXObject("Microsoft.XMLHTTP");
  }
  class OptionsValidator {
    constructor(params) {
      if (!this.validateParams(params)) {
        throw new Error("-- OptionsValidator: required options missing");
      }
      this.requiredOptions = params.required;
    }
    getRequiredOptions() {
      return this.requiredOptions;
    }
    validate(parameters) {
      const errors = [];
      this.requiredOptions.forEach((requiredOptionName) => {
        if (typeof parameters[requiredOptionName] === "undefined") {
          errors.push(requiredOptionName);
        }
      });
      return errors;
    }
    validateParams(params) {
      if (!params) {
        return false;
      }
      return typeof params.required !== "undefined" && Array.isArray(params.required);
    }
  }
  function findLiteralMatches(text, criteria) {
    const lowerText = text.trim().toLowerCase();
    const pattern = criteria.endsWith(" ") ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(" ");
    const wordsFound = pattern.filter((word) => lowerText.indexOf(word) >= 0).length;
    if (wordsFound !== pattern.length) {
      return [];
    }
    const matches = [];
    for (const word of pattern) {
      let startIndex = 0;
      while ((startIndex = lowerText.indexOf(word, startIndex)) !== -1) {
        matches.push({
          start: startIndex,
          end: startIndex + word.length,
          text: text.substring(startIndex, startIndex + word.length),
          type: "exact"
        });
        startIndex += word.length;
      }
    }
    return matches;
  }
  function findFuzzyMatches(text, criteria) {
    criteria = criteria.trimEnd();
    if (criteria.length === 0) return [];
    const lowerText = text.toLowerCase();
    const lowerCriteria = criteria.toLowerCase();
    let textIndex = 0;
    let criteriaIndex = 0;
    const matchedIndices = [];
    while (textIndex < text.length && criteriaIndex < criteria.length) {
      if (lowerText[textIndex] === lowerCriteria[criteriaIndex]) {
        matchedIndices.push(textIndex);
        criteriaIndex++;
      }
      textIndex++;
    }
    if (criteriaIndex !== criteria.length) {
      return [];
    }
    if (matchedIndices.length === 0) {
      return [];
    }
    const start = matchedIndices[0];
    const end = matchedIndices[matchedIndices.length - 1] + 1;
    return [{
      start,
      end,
      text: text.substring(start, end),
      type: "fuzzy"
    }];
  }
  function findWildcardMatches(text, pattern) {
    const regexPattern = pattern.replace(/\*/g, ".*");
    const regex = new RegExp(regexPattern, "gi");
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: "wildcard"
      });
      if (regex.lastIndex === match.index) {
        regex.lastIndex++;
      }
    }
    return matches;
  }
  class SearchCache {
    constructor(options2 = {}) {
      this.cache = /* @__PURE__ */ new Map();
      this.hitCount = 0;
      this.missCount = 0;
      this.options = {
        maxSize: options2.maxSize || 1e3,
        ttl: options2.ttl || 6e4
      };
    }
    get(key) {
      const entry = this.cache.get(key);
      if (!entry) {
        this.missCount++;
        return void 0;
      }
      if (Date.now() - entry.timestamp > this.options.ttl) {
        this.cache.delete(key);
        this.missCount++;
        return void 0;
      }
      entry.hits++;
      this.hitCount++;
      return entry.value;
    }
    set(key, value) {
      if (this.cache.size >= this.options.maxSize) {
        this.evictOldest();
      }
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        hits: 0
      });
    }
    clear() {
      this.cache.clear();
      this.hitCount = 0;
      this.missCount = 0;
    }
    evictOldest() {
      let oldestKey;
      let lowestScore = Infinity;
      for (const [key, entry] of this.cache) {
        const score = entry.timestamp + entry.hits * 1e4;
        if (score < lowestScore) {
          lowestScore = score;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    getStats() {
      const total = this.hitCount + this.missCount;
      const hitRate = total > 0 ? this.hitCount / total : 0;
      return {
        size: this.cache.size,
        maxSize: this.options.maxSize,
        ttl: this.options.ttl,
        hits: this.hitCount,
        misses: this.missCount,
        hitRate: Math.round(hitRate * 1e4) / 100
      };
    }
    has(key) {
      const entry = this.cache.get(key);
      if (!entry) return false;
      if (Date.now() - entry.timestamp > this.options.ttl) {
        this.cache.delete(key);
        return false;
      }
      return true;
    }
  }
  class SearchStrategy {
    constructor(findMatchesFunction) {
      this.findMatchesFunction = findMatchesFunction;
      this.cache = new SearchCache({ maxSize: 500, ttl: 6e4 });
    }
    matches(text, criteria) {
      if (text === null || text.trim() === "" || !criteria) {
        return false;
      }
      const cacheKey = this.getCacheKey(text, criteria);
      const cached = this.cache.get(cacheKey);
      if (cached !== void 0) {
        return cached.matches;
      }
      const matchInfo = this.findMatchesInternal(text, criteria);
      const result = {
        matches: matchInfo.length > 0,
        matchInfo
      };
      this.cache.set(cacheKey, result);
      return result.matches;
    }
    findMatches(text, criteria) {
      if (text === null || text.trim() === "" || !criteria) {
        return [];
      }
      const cacheKey = this.getCacheKey(text, criteria);
      const cached = this.cache.get(cacheKey);
      if (cached !== void 0) {
        return cached.matchInfo;
      }
      const matchInfo = this.findMatchesInternal(text, criteria);
      const result = {
        matches: matchInfo.length > 0,
        matchInfo
      };
      this.cache.set(cacheKey, result);
      return result.matchInfo;
    }
    findMatchesInternal(text, criteria) {
      return this.findMatchesFunction(text, criteria);
    }
    getCacheKey(text, criteria) {
      return `${text.length}:${criteria}:${text.substring(0, 20)}`;
    }
    clearCache() {
      this.cache.clear();
    }
    getCacheStats() {
      const stats = this.cache.getStats();
      return {
        hitRate: stats.hitRate,
        size: stats.size
      };
    }
  }
  const LiteralSearchStrategy = new SearchStrategy(
    findLiteralMatches
  );
  const FuzzySearchStrategy = new SearchStrategy(
    (text, criteria) => {
      const fuzzyMatches = findFuzzyMatches(text, criteria);
      if (fuzzyMatches.length > 0) {
        return fuzzyMatches;
      }
      return findLiteralMatches(text, criteria);
    }
  );
  const WildcardSearchStrategy = new SearchStrategy(
    (text, criteria) => {
      const wildcardMatches = findWildcardMatches(text, criteria);
      if (wildcardMatches.length > 0) {
        return wildcardMatches;
      }
      return findLiteralMatches(text, criteria);
    }
  );
  class HybridSearchStrategy extends SearchStrategy {
    constructor(config = {}) {
      super((text, criteria) => {
        return this.hybridFind(text, criteria);
      });
      this.config = {
        preferFuzzy: config.preferFuzzy ?? false,
        wildcardPriority: config.wildcardPriority ?? true,
        minFuzzyLength: config.minFuzzyLength ?? 3
      };
    }
    hybridFind(text, criteria) {
      if (this.config.wildcardPriority && criteria.includes("*")) {
        const wildcardMatches = findWildcardMatches(text, criteria);
        if (wildcardMatches.length > 0) return wildcardMatches;
      }
      if (criteria.includes(" ") || criteria.length < this.config.minFuzzyLength) {
        const literalMatches = findLiteralMatches(text, criteria);
        if (literalMatches.length > 0) return literalMatches;
      }
      if (this.config.preferFuzzy || criteria.length >= this.config.minFuzzyLength) {
        const fuzzyMatches = findFuzzyMatches(text, criteria);
        if (fuzzyMatches.length > 0) return fuzzyMatches;
      }
      return findLiteralMatches(text, criteria);
    }
    getConfig() {
      return { ...this.config };
    }
  }
  const DefaultHybridSearchStrategy = new HybridSearchStrategy();
  class StrategyFactory {
    static create(config) {
      if (typeof config === "string") {
        config = { type: config };
      }
      switch (config.type) {
        case "literal":
          return LiteralSearchStrategy;
        case "fuzzy":
          return FuzzySearchStrategy;
        case "wildcard":
          return WildcardSearchStrategy;
        case "hybrid":
          return new HybridSearchStrategy(config.hybridConfig);
        default:
          return LiteralSearchStrategy;
      }
    }
    static getAvailableStrategies() {
      return ["literal", "fuzzy", "wildcard", "hybrid"];
    }
    static isValidStrategy(type) {
      return this.getAvailableStrategies().includes(type);
    }
  }
  function merge(target, source) {
    return { ...target, ...source };
  }
  function isJSON(json) {
    try {
      return !!(json instanceof Object && JSON.parse(JSON.stringify(json)));
    } catch (_err) {
      return false;
    }
  }
  function NoSort() {
    return 0;
  }
  function isObject(obj) {
    return Boolean(obj) && Object.prototype.toString.call(obj) === "[object Object]";
  }
  function clone(input) {
    if (input === null || typeof input !== "object") {
      return input;
    }
    if (Array.isArray(input)) {
      return input.map((item) => clone(item));
    }
    const output = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        output[key] = clone(input[key]);
      }
    }
    return output;
  }
  const DEFAULT_OPTIONS = {
    searchInput: null,
    resultsContainer: null,
    json: [],
    success: function() {
    },
    searchResultTemplate: '<li><a href="{url}" title="{desc}">{title}</a></li>',
    templateMiddleware: (_prop, _value, _template) => void 0,
    sortMiddleware: NoSort,
    noResultsText: "No results found",
    limit: 10,
    fuzzy: false,
    strategy: "literal",
    debounceTime: null,
    exclude: [],
    onSearch: () => {
    }
  };
  const REQUIRED_OPTIONS = ["searchInput", "resultsContainer", "json"];
  const WHITELISTED_KEYS = /* @__PURE__ */ new Set([
    "Enter",
    "Shift",
    "CapsLock",
    "ArrowLeft",
    "ArrowUp",
    "ArrowRight",
    "ArrowDown",
    "Meta"
  ]);
  class Repository {
    constructor(initialOptions = {}) {
      this.data = [];
      this.setOptions(initialOptions);
    }
    put(input) {
      if (isObject(input)) {
        return this.addObject(input);
      }
      if (Array.isArray(input)) {
        return this.addArray(input);
      }
      return void 0;
    }
    clear() {
      this.data.length = 0;
      return this.data;
    }
    search(criteria) {
      if (!criteria) {
        return [];
      }
      return clone(this.findMatches(this.data, criteria).sort(this.options.sortMiddleware));
    }
    setOptions(newOptions) {
      this.options = {
        fuzzy: (newOptions == null ? void 0 : newOptions.fuzzy) || DEFAULT_OPTIONS.fuzzy,
        limit: (newOptions == null ? void 0 : newOptions.limit) || DEFAULT_OPTIONS.limit,
        searchStrategy: this.searchStrategy((newOptions == null ? void 0 : newOptions.strategy) || newOptions.fuzzy && "fuzzy" || DEFAULT_OPTIONS.strategy),
        sortMiddleware: (newOptions == null ? void 0 : newOptions.sortMiddleware) || DEFAULT_OPTIONS.sortMiddleware,
        exclude: (newOptions == null ? void 0 : newOptions.exclude) || DEFAULT_OPTIONS.exclude,
        strategy: (newOptions == null ? void 0 : newOptions.strategy) || DEFAULT_OPTIONS.strategy
      };
    }
    addObject(obj) {
      this.data.push(obj);
      return this.data;
    }
    addArray(arr) {
      const added = [];
      this.clear();
      for (const item of arr) {
        if (isObject(item)) {
          added.push(this.addObject(item)[0]);
        }
      }
      return added;
    }
    findMatches(data, criteria) {
      const matches = [];
      for (let i = 0; i < data.length && matches.length < this.options.limit; i++) {
        const match = this.findMatchesInObject(data[i], criteria);
        if (match) {
          matches.push(match);
        }
      }
      return matches;
    }
    findMatchesInObject(obj, criteria) {
      let hasMatch = false;
      const result = { ...obj };
      result._matchInfo = {};
      for (const key in obj) {
        if (!this.isExcluded(obj[key]) && this.options.searchStrategy.matches(obj[key], criteria)) {
          hasMatch = true;
          if (this.options.searchStrategy.findMatches) {
            const matchInfo = this.options.searchStrategy.findMatches(obj[key], criteria);
            if (matchInfo && matchInfo.length > 0) {
              result._matchInfo[key] = matchInfo;
            }
          }
        }
      }
      return hasMatch ? result : void 0;
    }
    isExcluded(term) {
      for (const excludedTerm of this.options.exclude) {
        if (new RegExp(excludedTerm).test(String(term))) {
          return true;
        }
      }
      return false;
    }
    searchStrategy(strategy) {
      if (StrategyFactory.isValidStrategy(strategy)) {
        return StrategyFactory.create(strategy);
      }
      switch (strategy) {
        case "fuzzy":
          return FuzzySearchStrategy;
        case "wildcard":
          return WildcardSearchStrategy;
        default:
          return LiteralSearchStrategy;
      }
    }
  }
  const options = {
    pattern: /\{(.*?)\}/g,
    template: "",
    middleware: function() {
      return void 0;
    }
  };
  function setOptions(_options) {
    if (_options.pattern) {
      options.pattern = _options.pattern;
    }
    if (_options.template) {
      options.template = _options.template;
    }
    if (typeof _options.middleware === "function") {
      options.middleware = _options.middleware;
    }
  }
  function compile(data, query) {
    return options.template.replace(options.pattern, function(match, prop) {
      var _a;
      const matchInfo = (_a = data._matchInfo) == null ? void 0 : _a[prop];
      if (matchInfo && matchInfo.length > 0 && query) {
        const value2 = options.middleware(prop, data[prop], options.template, query, matchInfo);
        if (typeof value2 !== "undefined") {
          return value2;
        }
      }
      if (query) {
        const value2 = options.middleware(prop, data[prop], options.template, query);
        if (typeof value2 !== "undefined") {
          return value2;
        }
      }
      const value = options.middleware(prop, data[prop], options.template);
      if (typeof value !== "undefined") {
        return value;
      }
      return data[prop] || match;
    });
  }
  let SimpleJekyllSearch$1 = class SimpleJekyllSearch {
    constructor() {
      this.debounceTimerHandle = null;
      this.options = { ...DEFAULT_OPTIONS };
      this.repository = new Repository();
      this.optionsValidator = new OptionsValidator({
        required: REQUIRED_OPTIONS
      });
    }
    debounce(func, delayMillis) {
      if (delayMillis) {
        if (this.debounceTimerHandle) {
          clearTimeout(this.debounceTimerHandle);
        }
        this.debounceTimerHandle = setTimeout(func, delayMillis);
      } else {
        func();
      }
    }
    throwError(message) {
      throw new Error(`SimpleJekyllSearch --- ${message}`);
    }
    emptyResultsContainer() {
      this.options.resultsContainer.innerHTML = "";
    }
    initWithJSON(json) {
      this.repository.put(json);
      this.registerInput();
    }
    initWithURL(url) {
      load(url, (err, json) => {
        if (err) {
          this.throwError(`Failed to load JSON from ${url}: ${err.message}`);
        }
        this.initWithJSON(json);
      });
    }
    registerInput() {
      this.options.searchInput.addEventListener("input", (e) => {
        const inputEvent = e;
        if (!WHITELISTED_KEYS.has(inputEvent.key)) {
          this.emptyResultsContainer();
          this.debounce(() => {
            this.search(e.target.value);
          }, this.options.debounceTime ?? null);
        }
      });
    }
    search(query) {
      var _a, _b;
      if ((query == null ? void 0 : query.trim().length) > 0) {
        this.emptyResultsContainer();
        const results = this.repository.search(query);
        this.render(results, query);
        (_b = (_a = this.options).onSearch) == null ? void 0 : _b.call(_a);
      }
    }
    render(results, query) {
      if (results.length === 0) {
        this.options.resultsContainer.insertAdjacentHTML("beforeend", this.options.noResultsText);
        return;
      }
      const fragment = document.createDocumentFragment();
      results.forEach((result) => {
        result.query = query;
        const div = document.createElement("div");
        div.innerHTML = compile(result, query);
        fragment.appendChild(div);
      });
      this.options.resultsContainer.appendChild(fragment);
    }
    init(_options) {
      var _a;
      const errors = this.optionsValidator.validate(_options);
      if (errors.length > 0) {
        this.throwError(`Missing required options: ${REQUIRED_OPTIONS.join(", ")}`);
      }
      this.options = merge(this.options, _options);
      setOptions({
        template: this.options.searchResultTemplate,
        middleware: this.options.templateMiddleware
      });
      this.repository.setOptions({
        fuzzy: this.options.fuzzy,
        limit: this.options.limit,
        sortMiddleware: this.options.sortMiddleware,
        strategy: this.options.strategy,
        exclude: this.options.exclude
      });
      if (isJSON(this.options.json)) {
        this.initWithJSON(this.options.json);
      } else {
        this.initWithURL(this.options.json);
      }
      const rv = {
        search: this.search.bind(this)
      };
      (_a = this.options.success) == null ? void 0 : _a.call(rv);
      return rv;
    }
  };
  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
  function mergeOverlappingMatches(matches) {
    if (matches.length === 0) return [];
    const sorted = [...matches].sort((a, b) => a.start - b.start);
    const merged = [{ ...sorted[0] }];
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push({ ...current });
      }
    }
    return merged;
  }
  function highlightWithMatchInfo(text, matchInfo, options2 = {}) {
    if (!text || matchInfo.length === 0) {
      return escapeHtml(text);
    }
    const className = options2.className || "search-highlight";
    const maxLength = options2.maxLength;
    const mergedMatches = mergeOverlappingMatches(matchInfo);
    let result = "";
    let lastIndex = 0;
    for (const match of mergedMatches) {
      result += escapeHtml(text.substring(lastIndex, match.start));
      result += `<span class="${className}">${escapeHtml(text.substring(match.start, match.end))}</span>`;
      lastIndex = match.end;
    }
    result += escapeHtml(text.substring(lastIndex));
    if (maxLength && result.length > maxLength) {
      result = truncateAroundMatches(text, mergedMatches, maxLength, options2.contextLength || 30, className);
    }
    return result;
  }
  function truncateAroundMatches(text, matches, maxLength, contextLength, className) {
    if (matches.length === 0) {
      const truncated = text.substring(0, maxLength - 3);
      return escapeHtml(truncated) + "...";
    }
    const firstMatch = matches[0];
    const start = Math.max(0, firstMatch.start - contextLength);
    const end = Math.min(text.length, firstMatch.end + contextLength);
    let result = "";
    if (start > 0) {
      result += "...";
    }
    const snippet = text.substring(start, end);
    const adjustedMatches = matches.filter((m) => m.start < end && m.end > start).map((m) => ({
      ...m,
      start: Math.max(0, m.start - start),
      end: Math.min(snippet.length, m.end - start)
    }));
    let lastIndex = 0;
    for (const match of adjustedMatches) {
      result += escapeHtml(snippet.substring(lastIndex, match.start));
      result += `<span class="${className}">${escapeHtml(snippet.substring(match.start, match.end))}</span>`;
      lastIndex = match.end;
    }
    result += escapeHtml(snippet.substring(lastIndex));
    if (end < text.length) {
      result += "...";
    }
    return result;
  }
  function createHighlightTemplateMiddleware(options2 = {}) {
    const highlightOptions = {
      className: options2.className || "search-highlight",
      maxLength: options2.maxLength,
      contextLength: options2.contextLength || 30
    };
    return function(prop, value, _template, query, matchInfo) {
      if ((prop === "content" || prop === "desc" || prop === "description") && query && typeof value === "string") {
        if (matchInfo && matchInfo.length > 0) {
          const highlighted = highlightWithMatchInfo(value, matchInfo, highlightOptions);
          return highlighted !== value ? highlighted : void 0;
        }
      }
      return void 0;
    };
  }
  function defaultHighlightMiddleware(prop, value, template, query, matchInfo) {
    const middleware = createHighlightTemplateMiddleware();
    return middleware(prop, value, template, query, matchInfo);
  }
  function SimpleJekyllSearch(options2) {
    const instance = new SimpleJekyllSearch$1();
    return instance.init(options2);
  }
  if (typeof window !== "undefined") {
    window.SimpleJekyllSearch = SimpleJekyllSearch;
    window.createHighlightTemplateMiddleware = createHighlightTemplateMiddleware;
  }
  exports2.DefaultHybridSearchStrategy = DefaultHybridSearchStrategy;
  exports2.HybridSearchStrategy = HybridSearchStrategy;
  exports2.StrategyFactory = StrategyFactory;
  exports2.createHighlightTemplateMiddleware = createHighlightTemplateMiddleware;
  exports2.default = SimpleJekyllSearch;
  exports2.defaultHighlightMiddleware = defaultHighlightMiddleware;
  exports2.escapeHtml = escapeHtml;
  exports2.highlightWithMatchInfo = highlightWithMatchInfo;
  exports2.mergeOverlappingMatches = mergeOverlappingMatches;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
});
