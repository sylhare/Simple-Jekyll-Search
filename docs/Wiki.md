---
layout: page
title: Wiki
permalink: /wiki/
---

For question and troubleshooting Simple Jekyll Search. 

## If search isn't working due to invalid JSON

- There is a filter plugin in the _plugins folder which should remove most characters that cause invalid JSON.
  To use it, add the simple_search_filter.rb file to your _plugins folder, and use `remove_chars` as a filter.

For example, in search.json, replace:

{% raw %}
```liquid
"content": "{{ page.content | strip_html | strip_newlines }}"
```
{% endraw %}

with

{% raw %}
```liquid
"content": "{{ page.content | strip_html | strip_newlines | remove_chars | escape }}"
```
{% endraw %}
If this doesn't work when using GitHub pages you can try `jsonify` to make sure the content is json compatible:

{% raw %}
```liquid
"content": {{ page.content | jsonify }}
```
{% endraw %}

> Note: you don't need to use quotes `"` in this since `jsonify` automatically inserts them.


## Enabling full-text search

The "full-text" search as to look in the content of the post and not just the title,
as well as the pages.
You could also add another loop for the collections.
Replace `search.json` with the following code:

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
    "date"     : "{{ post.date }}",
    "content"  : {{ post.content | strip_html | strip_newlines | jsonify }}
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
    "content"  : {{ post.content | strip_html | strip_newlines | jsonify }}
      {% endif %}
  } {% unless forloop.last %},{% endunless %}
  {% endfor %}
]
```
{% endraw %}