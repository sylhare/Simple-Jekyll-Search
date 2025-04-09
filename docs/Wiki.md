# Welcome to the Simple-Jekyll-Search Wiki!

## If search isn't working due to invalid JSON

- There is a filter plugin in the _plugins folder which should remove most characters that cause invalid JSON.
  To use it, add the simple_search_filter.rb file to your _plugins folder, and use `remove_chars` as a filter.

For example: in search.json, replace

```json
"content": "{{ page.content | strip_html | strip_newlines }}"
```

with

```json
"content": "{{ page.content | strip_html | strip_newlines | remove_chars | escape }}"
```

If this doesn't work when using GitHub pages you can try `jsonify` to make sure the content is json compatible:

```js
"content": {{ page.content | jsonify }}
```

**Note: you don't need to use quotes `"` in this since `jsonify` automatically inserts them.**


## Enabling full-text search

Replace `search.json` with the following code:

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
    "date"     : "{{ post.date }}",
    "content"  : "{{ post.content | strip_html | strip_newlines }}"
  } {% unless forloop.last %},{% endunless %}
  {% endfor %}
  ,
  {% for page in site.pages %}
  {
    {% if page.title != nil %}
    "title"    : "{{ page.title | escape }}",
    "category" : "{{ page.category }}",
    "tags"     : "{{ page.tags | join: ', ' }}",
    "url"      : "{{ site.baseurl }}{{ page.url }}",
    "date"     : "{{ page.date }}",
    "content"  : "{{ page.content | strip_html | strip_newlines }}"
      {% endif %}
  } {% unless forloop.last %},{% endunless %}
  {% endfor %}
]
```
