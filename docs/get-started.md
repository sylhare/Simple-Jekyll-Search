---
layout: page
title: Get Started
permalink: /about/
---

This is a jekyll theme inspired by [jekyll-new](github.com/jglovier/jekyll-new) (jekyll 2.0's default theme),
to showcase the jekyll-simple-search library.

### Create `search.json`

Place the following code in a file called `search.json` in your Jekyll blog. 
(It's hosted [here]({{ "/assets/data/search.json" | relative_url }}) or in https://github.com/sylhare/Simple-Jekyll-Search/tree/docs/assets/data)

This file will be used as a small data source to perform the searches on the client side:

{% raw %}
```liquid
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
{% endraw %}

### Add the search bar

SimpleJekyllSearch needs two `DOM` elements to work:

- a search input field
- a result container to display the results

{% raw %}
```html
<div id="search-demo-container">
  <input type="search" id="search-input" placeholder="search...">
  <ul id="results-container"></ul>
</div>
```
{% endraw %}

### Add the script

Customize SimpleJekyllSearch by passing in your configuration options:

{% raw %}
```html
<script src="{{ '/assets/js/simple-jekyll-search.min.js' | prepend: site.baseurl }}"></script>

<script>
  window.simpleJekyllSearch = new SimpleJekyllSearch({
    searchInput: document.getElementById('search-input'),
    resultsContainer: document.getElementById('results-container'),
    json: '{{ "/assets/data/search.json" | relative_url }}',
    searchResultTemplate: '<li><a href="{url}?query={query}" title="{desc}">{title}</a></li>',
    noResultsText: 'No results found',
    limit: 10,
    fuzzy: true,
    exclude: ['Welcome']
  })
</script>
```
{% endraw %}