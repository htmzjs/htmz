# HTMZ.js

Bring reactivity to your HTML! A minimal and lightweight library for building dynamic web UIs.

## Introduction

HTMZ.js brings the power of reactive programming directly to your HTML. With an intuitive API, it enables dynamic behavior in web pages without the overhead of larger frameworks.

## Features

- **Declarative Data Binding** – Easily link your data to HTML elements.
- **Simple & Lightweight** – Designed for ease of use and minimal footprint.
- **Event Handling** – Attach event listeners with built-in support.
- **Conditional Rendering** – Show or hide elements based on state.
- **List Rendering** – Dynamically generate elements from arrays.
- **Plugins Support** – Extend functionality with custom plugins.

## Installation

```sh
yarn add htmzjs # Or npm install htmzjs
```

## Usage

### Getting Started

```html
<div id="app">
  <button data-onclick="increment">Increment</button>
  <div data-text="Count: ${count}"></div>
</div>

<script type="module">
  import {
    HTMZ,
    Store,
  } from "https://www.unpkg.com/htmzjs@1.1.0/dist/index.js";

  const app = document.querySelector("#app");
  const appState = Store.setState({ count: 0 });

  HTMZ.initTree(app, appState, {
    increment(state) {
      state.count.value += 1;
    },
  });
</script>
```

### List Rendering (`data-range`)

You can dynamically generate a list of elements:

```html
<ul>
  <template data-range="5">
    <li>Item</li>
  </template>
</ul>
```

### Conditional Rendering & State Watching

```html
<div id="app">
  <button data-onclick="increment">Increment</button>
  <div data-text="Count: ${count}"></div>

  <div data-watch="count" data-if="count % 5 == 0; toggleHidden()" hidden>
    Content appears when count is a multiple of 5.
  </div>
</div>

<script type="module">
  import { HTMZ, Store } from "htmzjs";

  const app = document.querySelector("#app");
  const appState = Store.setState({ count: 0 });

  HTMZ.initTree(app, appState, {
    increment(state) {
      state.count.value += 1;
    },
    toggleHidden() {
      return () => {
        this.hidden = !this.hidden;
      };
    },
  });
</script>
```

### Plugin Support

HTMZ.js allows you to extend its functionality with plugins. Here’s an example of a `show` plugin:

```html
<div id="app">
  <button data-onclick="increment">Increment</button>
  <div data-text="Count: ${count}"></div>

  <div data-watch="count" data-show="count % 5 == 0">
    Content appears when count is a multiple of 5.
  </div>
</div>

<script type="module">
  import { HTMZ, Store } from "htmzjs";

  const app = document.querySelector("#app");
  const appState = Store.setState({
    count: 0,
  });
  const appActions = {
    increment: (state) => {
      state.count.value += 1;
    },
  };

  const showPlugin = {
    key: "show",
    init: (data, node) => {
      if (evaluate("return " + data.value, node.stateValue)) {
        node.element.hidden = false;
      } else {
        node.element.hidden = true;
      }
      node.handlerKeys.push(data.key);
    },
    update: (node) => {
      if (evaluate("return " + node.element.dataset.show, node.stateValue)) {
        node.element.hidden = false;
      } else {
        node.element.hidden = true;
      }
    },
  };

  HTMZ.initTree(app, appState, appActions, [showPlugin]);
</script>
```

## License

HTMZ.js is open-source and available under the [MIT License](https://github.com/htmzjs/htmz/blob/main/LICENSE).
