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
  function fuzzySearch(text, pattern) {
    pattern = pattern.trimEnd();
    if (pattern.length === 0) return true;
    pattern = pattern.toLowerCase();
    text = text.toLowerCase();
    let remainingText = text, currentIndex = -1;
    for (const char of pattern) {
      const nextIndex = remainingText.indexOf(char);
      if (nextIndex === -1 || currentIndex !== -1 && remainingText.slice(0, nextIndex).split(" ").length - 1 > 2) {
        return false;
      }
      currentIndex = nextIndex;
      remainingText = remainingText.slice(nextIndex + 1);
    }
    return true;
  }
  function findFuzzyMatches$1(text, pattern) {
    if (!text || !pattern) return [];
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase().trim();
    if (lowerPattern.length === 0) return [];
    const patternWords = lowerPattern.split(/\s+/);
    const matches = [];
    for (const word of patternWords) {
      if (word.length === 0) continue;
      const wordMatches = findFuzzyWordMatches$1(lowerText, word);
      matches.push(...wordMatches);
    }
    return mergeAndSortMatches$1(matches);
  }
  function findFuzzyWordMatches$1(text, word) {
    const matches = [];
    const exactRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    let match;
    while ((match = exactRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: "exact"
      });
    }
    if (matches.length === 0) {
      for (let i = 0; i < text.length; i++) {
        const fuzzyMatch = findFuzzySequenceMatch$1(text, word, i);
        if (fuzzyMatch) {
          matches.push({ ...fuzzyMatch, type: "fuzzy" });
          i = fuzzyMatch.end - 1;
        }
      }
    }
    return matches;
  }
  function findFuzzySequenceMatch$1(text, pattern, startPos) {
    let textIndex = startPos;
    let patternIndex = 0;
    let matchStart = -1;
    let maxGap = 3;
    const matchedPositions = [];
    while (textIndex < text.length && patternIndex < pattern.length) {
      if (text[textIndex] === pattern[patternIndex]) {
        if (matchStart === -1) {
          matchStart = textIndex;
        }
        matchedPositions.push(textIndex);
        patternIndex++;
      } else if (matchStart !== -1) {
        if (textIndex - matchStart > maxGap * pattern.length) {
          return null;
        }
      }
      textIndex++;
    }
    if (patternIndex === pattern.length && matchStart !== -1 && matchedPositions.length > 0) {
      const actualStart = matchedPositions[0];
      const actualEnd = matchedPositions[matchedPositions.length - 1] + 1;
      return {
        start: actualStart,
        end: actualEnd,
        text: text.substring(actualStart, actualEnd)
      };
    }
    return null;
  }
  function mergeAndSortMatches$1(matches) {
    if (matches.length === 0) return [];
    const sortedMatches = matches.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const match of sortedMatches) {
      const lastMerged = merged[merged.length - 1];
      if (lastMerged && match.start <= lastMerged.end) {
        lastMerged.end = Math.max(lastMerged.end, match.end);
        lastMerged.text = lastMerged.text + match.text.slice(lastMerged.end - match.start);
      } else {
        merged.push({ ...match });
      }
    }
    return merged;
  }
  function literalSearch(text, criteria) {
    text = text.trim().toLowerCase();
    const pattern = criteria.endsWith(" ") ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(" ");
    return pattern.filter((word) => text.indexOf(word) >= 0).length === pattern.length;
  }
  function findLiteralMatches(text, criteria) {
    if (!text || !criteria) return [];
    const lowerText = text.toLowerCase();
    const words = criteria.trim().toLowerCase().split(/\s+/);
    const matches = [];
    let textIndex = 0;
    for (const word of words) {
      if (word.length === 0) continue;
      const wordIndex = lowerText.indexOf(word, textIndex);
      if (wordIndex !== -1) {
        matches.push({
          start: wordIndex,
          end: wordIndex + word.length,
          text: text.substring(wordIndex, wordIndex + word.length),
          type: "exact"
        });
        textIndex = wordIndex + word.length;
      }
    }
    return matches;
  }
  function levenshtein(a, b) {
    const lenA = a.length;
    const lenB = b.length;
    const distanceMatrix = Array.from({ length: lenA + 1 }, () => Array(lenB + 1).fill(0));
    for (let i = 0; i <= lenA; i++) distanceMatrix[i][0] = i;
    for (let j = 0; j <= lenB; j++) distanceMatrix[0][j] = j;
    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        distanceMatrix[i][j] = Math.min(
          distanceMatrix[i - 1][j] + 1,
          distanceMatrix[i][j - 1] + 1,
          distanceMatrix[i - 1][j - 1] + cost
        );
      }
    }
    return distanceMatrix[lenA][lenB];
  }
  function levenshteinSearch(text, pattern) {
    const distance = levenshtein(pattern, text);
    const similarity = 1 - distance / Math.max(pattern.length, text.length);
    return similarity >= 0.3;
  }
  function findLevenshteinMatches(text, pattern) {
    if (!text || !pattern) return [];
    const matches = [];
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (levenshteinSearch(word, pattern)) {
        const start = text.indexOf(word);
        matches.push({
          start,
          end: start + word.length,
          text: word,
          type: "wildcard"
        });
      }
    }
    return matches;
  }
  function wildcardSearch(text, pattern) {
    const regexPattern = pattern.replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexPattern}$`, "i");
    if (regex.test(text)) return true;
    return levenshteinSearch(text, pattern);
  }
  function findWildcardMatches(text, pattern) {
    if (!text || !pattern) return [];
    const wildcardMatches = findWildcardPatternMatches(text, pattern);
    if (wildcardMatches.length > 0) {
      return mergeAndSortMatches(wildcardMatches);
    }
    const levenshteinMatches = findLevenshteinMatches(text, pattern);
    return mergeAndSortMatches(levenshteinMatches);
  }
  function findWildcardPatternMatches(text, pattern) {
    const matches = [];
    const regexPattern = pattern.replace(/\*/g, ".*");
    const regex = new RegExp(regexPattern, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: "wildcard"
      });
    }
    return matches;
  }
  function mergeAndSortMatches(matches) {
    if (matches.length === 0) return [];
    const sortedMatches = matches.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const match of sortedMatches) {
      const lastMerged = merged[merged.length - 1];
      if (lastMerged && match.start <= lastMerged.end) {
        lastMerged.end = Math.max(lastMerged.end, match.end);
        lastMerged.text = lastMerged.text + match.text.slice(lastMerged.end - match.start);
      } else {
        merged.push({ ...match });
      }
    }
    return merged;
  }
  class SearchStrategy {
    constructor(matchFunction, findMatchesFunction) {
      this.matchFunction = matchFunction;
      this.findMatchesFunction = findMatchesFunction;
    }
    matches(text, criteria) {
      if (text === null || text.trim() === "" || !criteria) {
        return false;
      }
      return this.matchFunction(text, criteria);
    }
    findMatches(text, criteria) {
      if (text === null || text.trim() === "" || !criteria || !this.findMatchesFunction) {
        return [];
      }
      return this.findMatchesFunction(text, criteria);
    }
  }
  const LiteralSearchStrategy = new SearchStrategy(literalSearch, findLiteralMatches);
  const FuzzySearchStrategy = new SearchStrategy(
    (text, criteria) => {
      return fuzzySearch(text, criteria) || literalSearch(text, criteria);
    },
    (text, criteria) => {
      const fuzzyMatches = findFuzzyMatches$1(text, criteria);
      if (fuzzyMatches.length > 0) {
        return fuzzyMatches;
      }
      return findLiteralMatches(text, criteria);
    }
  );
  const WildcardSearchStrategy = new SearchStrategy(
    (text, criteria) => {
      return wildcardSearch(text, criteria) || literalSearch(text, criteria);
    },
    (text, criteria) => {
      const wildcardMatches = findWildcardMatches(text, criteria);
      if (wildcardMatches.length > 0) {
        return wildcardMatches;
      }
      return findLiteralMatches(text, criteria);
    }
  );
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
    templateMiddleware: (_prop, _value, _template, _query) => void 0,
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
      var _a, _b;
      let hasMatch = false;
      const result = { ...obj };
      result._matchInfo = {};
      for (const key in obj) {
        if (!this.isExcluded(obj[key]) && this.options.searchStrategy.matches(obj[key], criteria)) {
          hasMatch = true;
          const matchInfo = (_b = (_a = this.options.searchStrategy).findMatches) == null ? void 0 : _b.call(_a, obj[key], criteria);
          if (matchInfo && matchInfo.length > 0) {
            result._matchInfo[key] = matchInfo;
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
      if (data._matchInfo && data._matchInfo[prop] && data._matchInfo[prop].length > 0) {
        try {
          const value2 = options.middleware(prop, data[prop], options.template, query, data._matchInfo[prop]);
          if (typeof value2 !== "undefined") {
            return value2;
          }
        } catch (_e) {
        }
      }
      const value = options.middleware(prop, data[prop], options.template, query);
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
  function createHighlightMiddleware(options2 = {}) {
    const {
      highlightClass = "sjs-highlight",
      contextBefore = 50,
      contextAfter = 50,
      maxLength = 250,
      ellipsis = "..."
    } = options2;
    return function(result, query) {
      if (!query || !result) {
        return result;
      }
      const highlightedResult = { ...result };
      const textFields = ["title", "desc", "content", "excerpt"];
      for (const field of textFields) {
        if (highlightedResult[field] && typeof highlightedResult[field] === "string") {
          const highlighted = highlightText(
            highlightedResult[field],
            query,
            { highlightClass, contextBefore, contextAfter, maxLength, ellipsis }
          );
          if (highlighted.highlightedText !== highlightedResult[field]) {
            highlightedResult[field] = highlighted.highlightedText;
          }
        }
      }
      return highlightedResult;
    };
  }
  function highlightText(text, query, options2 = {}) {
    const {
      highlightClass = "sjs-highlight",
      contextBefore = 50,
      contextAfter = 50,
      maxLength = 250,
      ellipsis = "..."
    } = options2;
    if (!text || !query) {
      return { highlightedText: text, matchCount: 0 };
    }
    const originalText = text;
    const searchTerms = query.trim().toLowerCase().split(/\s+/).filter((term) => term.length > 0);
    if (searchTerms.length === 0) {
      return { highlightedText: text, matchCount: 0 };
    }
    const matches = [];
    for (const term of searchTerms) {
      let index = 0;
      while (index < text.length) {
        const found = text.toLowerCase().indexOf(term, index);
        if (found === -1) break;
        matches.push({
          start: found,
          end: found + term.length,
          term: text.substring(found, found + term.length)
        });
        index = found + 1;
      }
    }
    if (matches.length === 0) {
      return { highlightedText: text, matchCount: 0 };
    }
    matches.sort((a, b) => a.start - b.start);
    const mergedMatches = [];
    for (const match of matches) {
      if (mergedMatches.length === 0 || mergedMatches[mergedMatches.length - 1].end < match.start) {
        mergedMatches.push(match);
      } else {
        const lastMatch = mergedMatches[mergedMatches.length - 1];
        lastMatch.end = Math.max(lastMatch.end, match.end);
        lastMatch.term = text.substring(lastMatch.start, lastMatch.end);
      }
    }
    if (text.length <= maxLength) {
      let highlightedText2 = text;
      for (let i = mergedMatches.length - 1; i >= 0; i--) {
        const match = mergedMatches[i];
        const before = highlightedText2.substring(0, match.start);
        const after = highlightedText2.substring(match.end);
        const matchText = highlightedText2.substring(match.start, match.end);
        highlightedText2 = before + `<span class="${highlightClass}">${matchText}</span>` + after;
      }
      return { highlightedText: highlightedText2, matchCount: mergedMatches.length };
    }
    let highlightedText = "";
    let totalLength = 0;
    let lastEnd = 0;
    for (let i = 0; i < mergedMatches.length; i++) {
      const match = mergedMatches[i];
      const contextStart = Math.max(lastEnd, match.start - contextBefore);
      const contextEnd = Math.min(text.length, match.end + contextAfter);
      if (contextStart > lastEnd && lastEnd > 0) {
        highlightedText += ellipsis;
        totalLength += ellipsis.length;
      }
      if (contextStart < match.start) {
        const beforeText = text.substring(contextStart, match.start);
        highlightedText += beforeText;
        totalLength += beforeText.length;
      }
      const matchText = text.substring(match.start, match.end);
      highlightedText += `<span class="${highlightClass}">${matchText}</span>`;
      totalLength += matchText.length;
      if (match.end < contextEnd) {
        const afterText = text.substring(match.end, contextEnd);
        highlightedText += afterText;
        totalLength += afterText.length;
      }
      lastEnd = contextEnd;
      if (totalLength >= maxLength) {
        if (contextEnd < text.length) {
          highlightedText += ellipsis;
        }
        break;
      }
    }
    return {
      highlightedText: highlightedText || originalText,
      matchCount: mergedMatches.length
    };
  }
  const defaultHighlightMiddleware = createHighlightMiddleware();
  function findFuzzyMatches(text, pattern) {
    const matches = [];
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase().trim();
    if (lowerPattern.length === 0) return matches;
    const patternWords = lowerPattern.split(/\s+/);
    for (const word of patternWords) {
      if (word.length === 0) continue;
      const wordMatches = findFuzzyWordMatches(lowerText, word);
      matches.push(...wordMatches);
    }
    return matches;
  }
  function findFuzzyWordMatches(text, word) {
    const matches = [];
    const exactRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    let match;
    while ((match = exactRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }
    if (matches.length === 0) {
      for (let i = 0; i < text.length; i++) {
        const fuzzyMatch = findFuzzySequenceMatch(text, word, i);
        if (fuzzyMatch) {
          matches.push(fuzzyMatch);
          i = fuzzyMatch.end - 1;
        }
      }
    }
    return matches;
  }
  function findFuzzySequenceMatch(text, pattern, startPos) {
    let textIndex = startPos;
    let patternIndex = 0;
    let matchStart = -1;
    let maxGap = 3;
    const matchedPositions = [];
    while (textIndex < text.length && patternIndex < pattern.length) {
      if (text[textIndex] === pattern[patternIndex]) {
        if (matchStart === -1) {
          matchStart = textIndex;
        }
        matchedPositions.push(textIndex);
        patternIndex++;
      } else if (matchStart !== -1) {
        if (textIndex - matchStart > maxGap * pattern.length) {
          return null;
        }
      }
      textIndex++;
    }
    if (patternIndex === pattern.length && matchStart !== -1 && matchedPositions.length > 0) {
      const actualStart = matchedPositions[0];
      const actualEnd = matchedPositions[matchedPositions.length - 1] + 1;
      return {
        start: actualStart,
        end: actualEnd,
        text: text.substring(actualStart, actualEnd)
      };
    }
    return null;
  }
  function highlightWithMatchInfo(text, matchInfo, options2) {
    if (matchInfo.length === 0) return text;
    const sortedMatches = [...matchInfo].sort((a, b) => b.start - a.start);
    let highlightedText = text;
    for (const match of sortedMatches) {
      const before = highlightedText.substring(0, match.start);
      const after = highlightedText.substring(match.end);
      const matchText = highlightedText.substring(match.start, match.end);
      highlightedText = before + `<span class="${options2.highlightClass}">${matchText}</span>` + after;
    }
    return highlightedText;
  }
  function highlightWithQuery(text, query, options2) {
    let highlightedText = text;
    let hasMatches = false;
    const searchTerms = query.trim().split(/\s+/).filter((term) => term.length > 0);
    for (const term of searchTerms) {
      const regex = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "gi");
      if (regex.test(highlightedText)) {
        highlightedText = highlightedText.replace(regex, `<span class="${options2.highlightClass}">$1</span>`);
        hasMatches = true;
      }
    }
    if (!hasMatches) {
      const fuzzyMatches = findFuzzyMatches(text, query);
      if (fuzzyMatches.length > 0) {
        fuzzyMatches.sort((a, b) => b.start - a.start);
        for (const match of fuzzyMatches) {
          const before = highlightedText.substring(0, match.start);
          const after = highlightedText.substring(match.end);
          const matchText = highlightedText.substring(match.start, match.end);
          highlightedText = before + `<span class="${options2.highlightClass}">${matchText}</span>` + after;
        }
        hasMatches = true;
      }
    }
    return highlightedText;
  }
  function createHighlightTemplateMiddleware(options2 = {}) {
    const highlightOptions = {
      highlightClass: "sjs-highlight",
      ...options2
    };
    return function(prop, value, _template, query, matchInfo) {
      if ((prop === "content" || prop === "desc") && query && typeof value === "string") {
        if (matchInfo && matchInfo.length > 0) {
          const highlighted2 = highlightWithMatchInfo(value, matchInfo, highlightOptions);
          return highlighted2 !== value ? highlighted2 : void 0;
        }
        const highlighted = highlightWithQuery(value, query, highlightOptions);
        return highlighted !== value ? highlighted : void 0;
      }
      return void 0;
    };
  }
  const defaultHighlightTemplateMiddleware = createHighlightTemplateMiddleware();
  function SimpleJekyllSearch(options2) {
    const instance = new SimpleJekyllSearch$1();
    return instance.init(options2);
  }
  if (typeof window !== "undefined") {
    window.SimpleJekyllSearch = SimpleJekyllSearch;
    window.SimpleJekyllSearch.createHighlightMiddleware = createHighlightMiddleware;
    window.SimpleJekyllSearch.createHighlightTemplateMiddleware = createHighlightTemplateMiddleware;
    window.SimpleJekyllSearch.highlightText = highlightText;
    window.SimpleJekyllSearch.defaultHighlightMiddleware = defaultHighlightMiddleware;
    window.SimpleJekyllSearch.defaultHighlightTemplateMiddleware = defaultHighlightTemplateMiddleware;
  }
  exports2.createHighlightMiddleware = createHighlightMiddleware;
  exports2.createHighlightTemplateMiddleware = createHighlightTemplateMiddleware;
  exports2.default = SimpleJekyllSearch;
  exports2.defaultHighlightMiddleware = defaultHighlightMiddleware;
  exports2.defaultHighlightTemplateMiddleware = defaultHighlightTemplateMiddleware;
  exports2.highlightText = highlightText;
  Object.defineProperties(exports2, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
});
