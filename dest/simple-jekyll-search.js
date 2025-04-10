(function(factory) {
  typeof define === "function" && define.amd ? define(factory) : factory();
})(function() {
  "use strict";
  const options$1 = {
    pattern: /\{(.*?)\}/g,
    template: "",
    middleware: function() {
      return void 0;
    }
  };
  function setOptions$1(_options) {
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
  function fuzzySearch(pattern, text) {
    pattern = pattern.trimEnd();
    if (pattern.length === 0) return true;
    if (text.length === 0) return false;
    pattern = pattern.toLowerCase();
    text = text.toLowerCase();
    let remainingText = text;
    for (const char of pattern) {
      const nextIndex = remainingText.indexOf(char);
      if (nextIndex === -1) {
        return false;
      }
      remainingText = remainingText.slice(nextIndex + 1);
    }
    return true;
  }
  class FuzzySearchStrategy {
    matches(string, criteria) {
      if (string === null) {
        return false;
      }
      return fuzzySearch(criteria, string);
    }
  }
  class LiteralSearchStrategy {
    matches(str, crit) {
      if (!str) return false;
      str = str.trim().toLowerCase();
      const criteria = crit.endsWith(" ") ? [crit.toLowerCase()] : crit.trim().toLowerCase().split(" ");
      return criteria.filter((word) => str.indexOf(word) >= 0).length === criteria.length;
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
  function setOptions(_opt) {
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
  let options = {
    searchInput: null,
    resultsContainer: null,
    json: [],
    success: function() {
    },
    searchResultTemplate: '<li><a href="{url}" title="{desc}">{title}</a></li>',
    templateMiddleware: function(_prop, _value, _template) {
      return void 0;
    },
    sortMiddleware: function(_a, _b) {
      return 0;
    },
    noResultsText: "No results found",
    limit: 10,
    fuzzy: false,
    debounceTime: null,
    exclude: [],
    onSearch: function() {
    }
  };
  let debounceTimerHandle;
  const debounce = function(func, delayMillis) {
    if (delayMillis) {
      clearTimeout(debounceTimerHandle);
      debounceTimerHandle = setTimeout(func, delayMillis);
    } else {
      func.call(null);
    }
  };
  const requiredOptions = ["searchInput", "resultsContainer", "json"];
  const optionsValidator = new OptionsValidator({
    required: requiredOptions
  });
  window.SimpleJekyllSearch = function(_options) {
    const errors = optionsValidator.validate(_options);
    if (errors.length > 0) {
      throwError("You must specify the following required options: " + requiredOptions);
    }
    options = merge(options, _options);
    setOptions$1({
      template: options.searchResultTemplate,
      middleware: options.templateMiddleware
    });
    setOptions({
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
    typeof options.success === "function" && options.success.call(rv);
    return rv;
  };
  function initWithJSON(json) {
    put(json);
    registerInput();
  }
  function initWithURL(url) {
    load(url, function(err, json) {
      if (err) {
        throwError("failed to get JSON (" + url + ")");
      }
      initWithJSON(json);
    });
  }
  function emptyResultsContainer() {
    options.resultsContainer.innerHTML = "";
  }
  function appendToResultsContainer(text) {
    options.resultsContainer.innerHTML += text;
  }
  function registerInput() {
    options.searchInput.addEventListener("input", function(e) {
      const inputEvent = e;
      if (isWhitelistedKey(inputEvent.which)) {
        emptyResultsContainer();
        debounce(function() {
          search(e.target.value);
        }, options.debounceTime || null);
      }
    });
  }
  function search(query) {
    if (isValidQuery(query)) {
      emptyResultsContainer();
      const results = search$1(query);
      render(results, query);
      typeof options.onSearch === "function" && options.onSearch.call(null);
    }
  }
  function render(results, query) {
    const len = results.length;
    if (len === 0) {
      return appendToResultsContainer(options.noResultsText);
    }
    for (let i = 0; i < len; i++) {
      results[i].query = query;
      appendToResultsContainer(compile(results[i]));
    }
  }
  function isValidQuery(query) {
    return Boolean(query && query.length > 0);
  }
  function isWhitelistedKey(key) {
    return [13, 16, 20, 37, 38, 39, 40, 91].indexOf(key) === -1;
  }
  function throwError(message) {
    throw new Error("SimpleJekyllSearch --- " + message);
  }
});
