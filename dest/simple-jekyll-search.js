(function(factory) {
  typeof define === "function" && define.amd ? define(factory) : factory();
})(function() {
  "use strict";
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
    debounceTime: null,
    exclude: [],
    onSearch: () => {
    }
  };
  const REQUIRED_OPTIONS = ["searchInput", "resultsContainer", "json"];
  const WHITELISTED_KEYS = /* @__PURE__ */ new Set([13, 16, 20, 37, 38, 39, 40, 91]);
  class SearchStrategy {
    constructor(matchFunction) {
      this.matchFunction = matchFunction;
    }
    matches(text, criteria) {
      if (text === null || text.trim() === "" || !criteria) {
        return false;
      }
      return this.matchFunction(text, criteria);
    }
  }
  function literalSearch(text, criteria) {
    text = text.trim().toLowerCase();
    const pattern = criteria.endsWith(" ") ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(" ");
    return pattern.filter((word) => text.indexOf(word) >= 0).length === pattern.length;
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
          // Removing a character from one string
          distanceMatrix[i][j - 1] + 1,
          // Adding a character to one string to make it closer to the other string.
          distanceMatrix[i - 1][j - 1] + cost
          // Replacing one character in a string with another
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
  function wildcardSearch(text, pattern) {
    const regexPattern = pattern.replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexPattern}$`, "i");
    if (regex.test(text)) return true;
    return levenshteinSearch(text, pattern);
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
  const LiteralSearchStrategy = new SearchStrategy(literalSearch);
  const FuzzySearchStrategy = new SearchStrategy((text, criteria) => {
    return fuzzySearch(text, criteria) || literalSearch(text, criteria);
  });
  const WildcardSearchStrategy = new SearchStrategy((text, criteria) => {
    return wildcardSearch(text, criteria) || literalSearch(text, criteria);
  });
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
        fuzzy: (newOptions == null ? void 0 : newOptions.fuzzy) || false,
        limit: (newOptions == null ? void 0 : newOptions.limit) || DEFAULT_OPTIONS.limit,
        searchStrategy: this.searchStrategy((newOptions == null ? void 0 : newOptions.strategy) || newOptions.fuzzy && "fuzzy"),
        sortMiddleware: (newOptions == null ? void 0 : newOptions.sortMiddleware) || DEFAULT_OPTIONS.sortMiddleware,
        exclude: (newOptions == null ? void 0 : newOptions.exclude) || DEFAULT_OPTIONS.exclude
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
      for (const key in obj) {
        if (!this.isExcluded(obj[key]) && this.options.searchStrategy.matches(obj[key], criteria)) {
          return obj;
        }
      }
      return void 0;
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
  const options$1 = {
    pattern: /\{(.*?)\}/g,
    template: "",
    middleware: function() {
      return void 0;
    }
  };
  function setOptions(_options) {
    if (_options.pattern) {
      options$1.pattern = _options.pattern;
    }
    if (_options.template) {
      options$1.template = _options.template;
    }
    if (typeof _options.middleware === "function") {
      options$1.middleware = _options.middleware;
    }
  }
  function compile(data) {
    return options$1.template.replace(options$1.pattern, function(match, prop) {
      const value = options$1.middleware(prop, data[prop], options$1.template);
      if (typeof value !== "undefined") {
        return value;
      }
      return data[prop] || match;
    });
  }
  let options = { ...DEFAULT_OPTIONS };
  let debounceTimerHandle;
  const repository = new Repository();
  const optionsValidator = new OptionsValidator({
    required: REQUIRED_OPTIONS
  });
  const debounce = (func, delayMillis) => {
    if (delayMillis) {
      clearTimeout(debounceTimerHandle);
      debounceTimerHandle = setTimeout(func, delayMillis);
    } else {
      func();
    }
  };
  const throwError = (message) => {
    throw new Error(`SimpleJekyllSearch --- ${message}`);
  };
  const emptyResultsContainer = () => {
    options.resultsContainer.innerHTML = "";
  };
  const appendToResultsContainer = (text) => {
    options.resultsContainer.insertAdjacentHTML("beforeend", text);
  };
  const isValidQuery = (query) => {
    return Boolean(query == null ? void 0 : query.trim());
  };
  const isWhitelistedKey = (key) => {
    return !WHITELISTED_KEYS.has(key);
  };
  const initWithJSON = (json) => {
    repository.put(json);
    registerInput();
  };
  const initWithURL = (url) => {
    load(url, (err, json) => {
      if (err) {
        throwError(`Failed to load JSON from ${url}: ${err.message}`);
      }
      initWithJSON(json);
    });
  };
  const registerInput = () => {
    options.searchInput.addEventListener("input", (e) => {
      const inputEvent = e;
      if (isWhitelistedKey(inputEvent.which)) {
        emptyResultsContainer();
        debounce(() => {
          search(e.target.value);
        }, options.debounceTime ?? null);
      }
    });
  };
  const search = (query) => {
    var _a;
    if (isValidQuery(query)) {
      emptyResultsContainer();
      render(repository.search(query), query);
      (_a = options.onSearch) == null ? void 0 : _a.call(options);
    }
  };
  const render = (results, query) => {
    if (results.length === 0) {
      appendToResultsContainer(options.noResultsText);
      return;
    }
    const fragment = document.createDocumentFragment();
    results.forEach((result) => {
      result.query = query;
      const li = document.createElement("li");
      li.innerHTML = compile(result);
      fragment.appendChild(li);
    });
    options.resultsContainer.appendChild(fragment);
  };
  window.SimpleJekyllSearch = function(_options) {
    var _a;
    const errors = optionsValidator.validate(_options);
    if (errors.length > 0) {
      throwError(`Missing required options: ${REQUIRED_OPTIONS.join(", ")}`);
    }
    options = merge(options, _options);
    setOptions({
      template: options.searchResultTemplate,
      middleware: options.templateMiddleware
    });
    repository.setOptions({
      fuzzy: options.fuzzy,
      limit: options.limit,
      sortMiddleware: options.sortMiddleware,
      strategy: options.strategy,
      exclude: options.exclude
    });
    if (isJSON(options.json)) {
      initWithJSON(options.json);
    } else {
      initWithURL(options.json);
    }
    const rv = {
      search
    };
    (_a = options.success) == null ? void 0 : _a.call(rv);
    return rv;
  };
});
