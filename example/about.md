---
layout: page
title: About
permalink: /about/
---

This is a jekyll theme inspired by [jekyll-new](github.com/jglovier/jekyll-new) (jekyll 2.0's default theme),
to showcase the jekyll-simple-search library.

### Create `search.json`

Place the following code in a file called `search.json` in the **root** of your Jekyll blog. (You can also get a copy [from here](/example/search.json))

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

### Add the search bar

SimpleJekyllSearch needs two `DOM` elements to work:

- a search input field
- a result container to display the results

```html
    <div id="search-demo-container">
      <input type="search" id="search-input" placeholder="search...">
      <ul id="results-container"></ul>
    </div>
```


### Add the script

Customize SimpleJekyllSearch by passing in your configuration options:

```html
<script src="{{ '/assets/js/simple-jekyll-search.min.js' | prepend: site.baseurl }}"></script>

<script>
  window.simpleJekyllSearch = new SimpleJekyllSearch({
    searchInput: document.getElementById('search-input'),
    resultsContainer: document.getElementById('results-container'),
    json: '{{ site.baseurl }}/search.json',
    searchResultTemplate: '<li><a href="{url}?query={query}" title="{desc}">{title}</a></li>',
    noResultsText: 'No results found',
    limit: 10,
    fuzzy: true,
    exclude: ['Welcome']
  })
</script>
```
