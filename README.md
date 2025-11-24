# Simple-Jekyll-Search

A JavaScript library to add search functionality to any Jekyll blog.

## Use case

You have a blog built with Jekyll and want a **lightweight search functionality** that is:
- Purely client-side
- No server configurations or databases to maintain
- Set up in just **5 minutes**

## Getting started

### Create `search.json`

Place the following code in a file called `search.json` in your Jekyll blog. 
(You can also get a copy [from here](/docs/assets/data/search.json))

This file will be used as a small data source to perform the searches on the client side:

```yaml
---
layout: none
---
[
  {% for post in site.posts %}
    {
      "title"    : "{{ post.title | escape }}",
      "category" : "{{ post.category }}",
      "tags"     : "{{ post.tags | join: ', ' }}",
      "url"      : "{{ post.url | relative_url }}",
      "date"     : "{{ post.date }}"
    } {% unless forloop.last %},{% endunless %}
  {% endfor %}
]
```

### Preparing the plugin

#### Add DOM elements

SimpleJekyllSearch needs two `DOM` elements to work:

- a search input field
- a result container to display the results

For example with the default configuration, 
you need to place the following code within the layout where you want the search to appear.
(See the configuration section below to customize it)

```html
<!-- HTML elements for search -->
<input type="text" id="search-input" placeholder="Search blog posts..">
<ul id="results-container"></ul>
```

### Usage

Customize `SimpleJekyllSearch` by passing in your configuration options:

```js
var sjs = SimpleJekyllSearch({
  searchInput: document.getElementById('search-input'),
  resultsContainer: document.getElementById('results-container'),
  json: '{{ "/assets/data/search.json" | relative_url }}',
})
```

The script and library needs to be imported in the `head` of your layout, or at the end of the `body` tag.

#### returns { search }

A new instance of SimpleJekyllSearch returns an object, with the only property `search`.
The `search` is a function used to simulate a user input and display the matching results.


```js
var sjs = SimpleJekyllSearch({ ...options })
sjs.search('Hello')
```

💡 it can be used to filter posts by tags or categories!

## Options

Here is a table for the available options, usage questions, troubleshooting & guides:

| Option                 | Type           | Required | Description                                                                                                                                                                        |
|------------------------|----------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `searchInput`          | Element        | Yes      | The input element on which the plugin should listen for keyboard events and trigger the searching and rendering for articles.                                                      |
| `resultsContainer`     | Element        | Yes      | The container element in which the search results should be rendered in. Typically, a `<ul>`.                                                                                      |
| `json`                 | String \| JSON | Yes      | You can either pass in an URL to the `search.json` file, or the results in form of JSON directly, to save one round trip to get the data.                                          |
| `noResultsText`        | String         | No       | The HTML that will be shown if the query didn't match anything.                                                                                                                    |
| `limit`                | Number         | No       | You can limit the number of posts rendered on the page.                                                                                                                            |
| `strategy`             | String         | No       | Selects the built-in search behavior: `'literal'` (default), `'fuzzy'`, `'wildcard'`, or `'hybrid'`.                                                                               |
| `exclude`              | Array          | No       | Pass in a list of terms you want to exclude (terms will be matched against a regex, so URLs, words are allowed).                                                                   |
| `success`              | Function       | No       | A function called once the data has been loaded.                                                                                                                                   |
| `debounceTime`         | Number         | No       | Limit how many times the search function can be executed over the given time window. If no `debounceTime` (milliseconds) is provided a search will be triggered on each keystroke. |
| `searchResultTemplate` | String         | No       | The template of a single rendered search result. (match liquid value eg: `'<li><a href="{{ site.url }}{url}">{title}</a></li>'`                                                    |

### Configurable strategies

The `strategy` option can also accept an object for advanced tuning:

```js
SimpleJekyllSearch({
  // ...
  strategy: {
    type: 'hybrid',
    options: {
      minFuzzyLength: 4,
      preferFuzzy: true,
      maxSpaces: 1   // Let `*` span up to 1 space (default: 0 = stop at spaces)
    }
  }
})
```

- `options` mirrors the hybrid strategy options (fuzzy length, priority, etc.) and also accepts `maxSpaces` for wildcard matching.
- `options.maxSpaces` lets wildcard searches capture up to _n_ spaces inside each `*` segment so patterns like `hel*rld` can match `"hello brave world"` when `maxSpaces >= 1`. (You can still set `options.maxSpaces` when using the dedicated `'wildcard'` strategy.)

## Middleware

### templateMiddleware (Function) [optional]

A function that will be called whenever a match in the template is found.
It gets passed the current property name, property value, template, query, and match information.
If the function returns a non-undefined value, it gets replaced in the template.

**New Interface:**
```js
templateMiddleware(prop, value, template, query?, matchInfo?)
```

- `prop`: The property name being processed from the JSON data.
- `value`: The property value
- `template`: The template string
- `query`: The search query (optional)
- `matchInfo`: Array of match information objects with start/end positions and match types (optional)

This can be useful for manipulating URLs, highlighting search terms, or custom formatting.

**Basic Example:**
```js
SimpleJekyllSearch({
  // ...other config
  searchResultTemplate: '<li>{title}</li>',
  templateMiddleware: function(prop, value, template, query, matchInfo) {
    if (prop === 'title') {
      return value.toUpperCase()
    }
  },
})
```

**How it works:**
- Template: `'<li>{title}</li>'`
- When processing `{title}`: `prop = 'title'`, `value = 'my post'` → returns `'MY POST'`
- Final result: `'<li>MY POST</li>'`


### sortMiddleware (Function) [optional]

A function that will be used to sort the filtered results.

By setting custom values in the search.json file, you can group the results by section or any other property.

Example:

```js
SimpleJekyllSearch({
  // ...other config
  sortMiddleware: function(a, b) {
    var astr = String(a.section) + "-" + String(a.caption);
    var bstr = String(b.section) + "-" + String(b.caption);
    return astr.localeCompare(bstr)
  },
})
```

### Built-in Highlight Middleware (Function) [optional]

Simple-Jekyll-Search now includes built-in highlighting functionality that can be easily integrated:

```js
import { createHighlightTemplateMiddleware } from 'simple-jekyll-search/middleware';

SimpleJekyllSearch({
  // ...other config
  templateMiddleware: createHighlightTemplateMiddleware({
    className: 'search-highlight',  // CSS class for highlighted text
    maxLength: 200,                 // Maximum length of highlighted content
    contextLength: 30               // Characters of context around matches
  }),
})
```

**Highlight Options:**
- `className`: CSS class name for highlighted spans (default: 'search-highlight')
- `maxLength`: Maximum length of content to display (truncates with ellipsis)
- `contextLength`: Number of characters to show around matches when truncating

**CSS Styling:**
```css
.search-highlight {
  background-color: yellow;
  font-weight: bold;
}
```
