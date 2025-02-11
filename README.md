# HTMZ.js

A minimal and lightweight library for building reactive web UIs.

<!-- [![npm version](https://badge.fury.io/js/htmzjs)](https://www.npmjs.com/package/htmzjs) -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Introduction

HTMZ brings the power of reactive programming directly to your HTML. It allows you to easily add dynamic behavior to your web pages without the complexity of larger frameworks.

## Features

* **Declarative data binding:** Connect your data to your HTML elements effortlessly.
* **Simple API:** Easy to learn and use, even for beginners.

## Usage

### Getting Started

```html
<div id="app">
  <button data-onclick="increment">Increment</button>
  <div data-text="Count: ${count}"></div>
</div>

<script type="module">
  import { HTMZ, Store } from "https://www.unpkg.com/htmzjs@1.0.0/dist/index.js"

  const app = document.querySelector('#app');
  const appState = Store.setState({count: 0});

  HTMZ.initTree(app, appState, {
    increment: function (state) {
      state.count.value += 1;
    },
  });
</script>
```

### data-range
```html
<ul>
  <template data-range="5">
    <li>item</li>
  </template>
</ul>
```

### example
```html
<div id="app">
  <button data-onclick="increment">Increment</button>
  <div data-text="Count: ${count}"></div>

  <div data-watch="count" data-if="count % 5 == 0, toggleHidden()" hidden>
    Content......
  </div>
</div>

<script type="module">
  import {HTMZ, Store} from "htmzjs"

  const app = document.querySelector('#app');
  const appState = Store.setState({ count: 0 });

  HTMZ.initTree(app, appState, {
    increment: function (state, event) {
      state.count.value += 1;
    },
    toggleHidden: function () => () => {
      this.hidden = !this.hidden
    }
  });
</script>
```
