# HTMZ.js

Enhance your HTML with seamless reactivity!  
A lightweight library for building dynamic web interfaces and single-page applications.

---

- ⚡ Lightweight and fast
- 🧠 Reactive data updates
- 📝 Declarative data binding
- 🔒 CSP compatible

---

## Install

```bash
yarn add @htmzjs/core
```
---

## Overview
```html
<div id="app">
  <button @onclick="increment()">Increment</button>
  <div @text="Count: {count}"></div>
</div>

<script defer type="module">
  import * as htmz from "https://www.unpkg.com/@htmzjs/core@1.0.0/dist/index.js";

  const data = htmz.observe({
    count: 0,
    increment(){
      data.count++
    }
  });

  htmz.watch(() => {
    console.log(data.count);
  });

  htmz.init("#app").data(data).walk();
</script>
```
---

## Docs
See the full documentation on [Github](https://github.com/htmzjs/htmz).
