(function(factory) {
  typeof define === "function" && define.amd ? define(factory) : factory();
})(function() {
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
  function fuzzySearch(pattern, text) {
    pattern = pattern.trimEnd();
    if (pattern.length === 0) return true;
    if (text.length === 0) return false;
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
  class FuzzySearchStrategy {
    matches(text, criteria) {
      if (text === null) {
        return false;
      }
      return fuzzySearch(criteria, text);
    }
  }
  class LiteralSearchStrategy {
    matches(text, criteria) {
      if (!text) return false;
      text = text.trim().toLowerCase();
      const pattern = criteria.endsWith(" ") ? [criteria.toLowerCase()] : criteria.trim().toLowerCase().split(" ");
      return pattern.filter((word) => text.indexOf(word) >= 0).length === pattern.length;
    }
  }
  function NoSort() {
    return 0;
  }
  const data = [];
  let opt = {
    limit: 10,
    searchStrategy: new FuzzySearchStrategy(),
    sort: NoSort,
    exclude: []
  };
  function put(input) {
    if (isObject(input)) {
      return addObject(input);
    }
    if (isArray(input)) {
      return addArray(input);
    }
    return void 0;
  }
  function clear() {
    data.length = 0;
    return data;
  }
  function isObject(obj) {
    return Boolean(obj) && Object.prototype.toString.call(obj) === "[object Object]";
  }
  function isArray(obj) {
    return Boolean(obj) && Object.prototype.toString.call(obj) === "[object Array]";
  }
  function addObject(_data) {
    data.push(_data);
    return data;
  }
  function addArray(_data) {
    const added = [];
    clear();
    for (let i = 0, len = _data.length; i < len; i++) {
      if (isObject(_data[i])) {
        added.push(addObject(_data[i])[0]);
      }
    }
    return added;
  }
  function search$1(criteria) {
    if (!criteria) {
      return [];
    }
    return findMatches(data, criteria, opt.searchStrategy, opt).sort(opt.sort);
  }
  function setOptions$1(_opt) {
    opt = {
      fuzzy: _opt.fuzzy || false,
      limit: _opt.limit || 10,
      searchStrategy: _opt.fuzzy ? new FuzzySearchStrategy() : new LiteralSearchStrategy(),
      sort: _opt.sort || NoSort,
      exclude: _opt.exclude || []
    };
  }
  function findMatches(data2, criteria, strategy, opt2) {
    const matches = [];
    for (let i = 0; i < data2.length && matches.length < opt2.limit; i++) {
      const match = findMatchesInObject(data2[i], criteria, strategy, opt2);
      if (match) {
        matches.push(match);
      }
    }
    return matches;
  }
  function findMatchesInObject(obj, criteria, strategy, opt2) {
    for (const key in obj) {
      if (!isExcluded(obj[key], opt2.exclude) && strategy.matches(obj[key], criteria)) {
        return obj;
      }
    }
    return void 0;
  }
  function isExcluded(term, excludedTerms) {
    for (let i = 0, len = excludedTerms.length; i < len; i++) {
      const excludedTerm = excludedTerms[i];
      if (new RegExp(excludedTerm).test(String(term))) {
        return true;
      }
    }
    return false;
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
  function compile(data2) {
    return options$1.template.replace(options$1.pattern, function(match, prop) {
      const value = options$1.middleware(prop, data2[prop], options$1.template);
      if (typeof value !== "undefined") {
        return value;
      }
      return data2[prop] || match;
    });
  }
  function merge(defaultParams, mergeParams) {
    const mergedOptions = {};
    for (const option in defaultParams) {
      mergedOptions[option] = defaultParams[option];
      if (typeof mergeParams[option] !== "undefined") {
        mergedOptions[option] = mergeParams[option];
      }
    }
    return mergedOptions;
  }
  function isJSON(json) {
    try {
      return !!(json instanceof Object && JSON.parse(JSON.stringify(json)));
    } catch (_err) {
      return false;
    }
  }
  const DEFAULT_OPTIONS = {
    searchInput: null,
    resultsContainer: null,
    json: [],
    success: function() {
    },
    searchResultTemplate: '<li><a href="{url}" title="{desc}">{title}</a></li>',
    templateMiddleware: (_prop, _value, _template) => void 0,
    sortMiddleware: () => 0,
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
  let options = { ...DEFAULT_OPTIONS };
  let debounceTimerHandle;
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
    put(json);
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
      const results = search$1(query);
      render(results, query);
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
    setOptions$1({
      fuzzy: options.fuzzy,
      limit: options.limit,
      sort: options.sortMiddleware,
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
