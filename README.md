# Simple-Jekyll-Search

A JavaScript library to add search functionality to any Jekyll blog.

## Use case

You have a blog built with Jekyll and want a **lightweight search functionality** that is:
- Purely client-side
- No server configurations or databases to maintain
- Set up in just **5 minutes**

## Getting started

### Create `search.json`

Place the following code in a file called `search.json` in the **root** of your Jekyll blog. 
(You can also get a copy [from here](/docs/search.json))

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
      "url"      : "{{ site.baseurl }}{{ post.url }}",
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
  json: '/search.json'
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

| Option             | Type          | Required | Description                                                                                       |
|--------------------|---------------|----------|---------------------------------------------------------------------------------------------------|
| `searchInput`      | Element       | Yes      | The input element on which the plugin should listen for keyboard events and trigger the searching and rendering for articles. |
| `resultsContainer` | Element       | Yes      | The container element in which the search results should be rendered in. Typically, a `<ul>`.      |
| `json`             | String \| JSON | Yes      | You can either pass in an URL to the `search.json` file, or the results in form of JSON directly, to save one round trip to get the data. |
| `noResultsText`    | String        | No       | The HTML that will be shown if the query didn't match anything.                                    |
| `limit`            | Number        | No       | You can limit the number of posts rendered on the page.                                            |
| `fuzzy`            | Boolean       | No       | Enable fuzzy search to allow less restrictive matching.                                            |
| `exclude`          | Array         | No       | Pass in a list of terms you want to exclude (terms will be matched against a regex, so URLs, words are allowed). |
| `success`          | Function      | No       | A function called once the data has been loaded.                                                   |
| `debounceTime`     | Number        | No       | Limit how many times the search function can be executed over the given time window. If no `debounceTime` (milliseconds) is provided a search will be triggered on each keystroke. |

### searchResultTemplate (String) [optional]

The template of a single rendered search result.

The templating syntax is very simple: You just enclose the properties you want to replace with curly braces.

E.g.

The template

```js
var sjs = SimpleJekyllSearch({
  searchInput: document.getElementById('search-input'),
  resultsContainer: document.getElementById('results-container'),
  json: '/search.json',
  searchResultTemplate: '<li><a href="{{ site.url }}{url}">{title}</a></li>'
})
```

will render to the following

```html
<li><a href="/jekyll/update/2014/11/01/welcome-to-jekyll.html">Welcome to Jekyll!</a></li>
```

If the `search.json` contains this data

```json
[
    {
      "title"    : "Welcome to Jekyll!",
      "category" : "",
      "tags"     : "",
      "url"      : "/jekyll/update/2014/11/01/welcome-to-jekyll.html",
      "date"     : "2014-11-01 21:07:22 +0100"
    }
]
```

### templateMiddleware (Function) [optional]

A function that will be called whenever a match in the template is found.

It gets passed the current property name, property value, and the template.

If the function returns a non-undefined value, it gets replaced in the template.

This can be potentially useful for manipulating URLs etc.

Example:

```js
SimpleJekyllSearch({
  // ...other config
  templateMiddleware: function(prop, value, template) {
    if (prop === 'bar') {
      return value.replace(/^\//, '')
    }
  },
})
```

See the [tests](https://github.com/christian-fei/Simple-Jekyll-Search/blob/master/tests/Templater.test.js) for an in-depth code example

### sortMiddleware (Function) [optional]

A function that will be used to sort the filtered results.

It can be used for example to group the sections together.

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
