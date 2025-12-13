---
layout: post
title: "Technical Example"
date: 2025-04-22 10:00:00
categories: [ search, tutorial ]
tags: [ regex, json, bash, code ]
---

This is an article with more technical content to test the search functionality.

A command with some regex and special characters:

```bash
grep -E -o "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" file.txt
sed 's/^[ \t]*//;s/[ \t]*$//' file.txt
sed -i 's/\"hostname\"\:.*$/\"hostname\"\: \"new-hostname\"/' config.json
```

A JSON object to test:

```json
{
  "name": "John Doe",
  "age": 30,
  "cities": [
    "New York",
    "Paris"
  ],
  "details": {
    "height": 180,
    "weight": 75
  }
}
```

Using highlight:

{% highlight terminal %}
...
Init4 = AT+CGDCONT=1,"IP","internetmas","",0,0
...
{% endhighlight %}

A tricky string to test the search:

```text
This    is    a    test    with    irregular    spacing.
Special characters: ~!@#$%^&*()_+`-={}|[]\:";'<>?,./
Escape sequences: \n \t \r \\


