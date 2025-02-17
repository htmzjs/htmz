# HTMZ.js

Enhance your HTML with seamless reactivity! A lightweight and efficient library for building dynamic web interfaces.

## Features

- **Declarative Data Binding** - Seamlessly bind data to HTML elements for dynamic updates.
- **Simple & Lightweight** - Designed for ease of use and minimal footprint.
- **Modern Component Architecture** - Leverages Web Components and Shadow DOM for true encapsulation.
- **Extensible with Plugins** - Easily enhance functionality with custom plugins.
- **Routing for Single-Page Applications** – Build single-page applications (SPAs) with built-in routing capabilities.
## Introduction

HTMZ.js empowers your HTML with the power of reactive programming. With its intuitive API, you can create dynamic, interactive web pages effortlessly—without the complexity or bloat of larger frameworks. The library also includes routing capabilities, enabling the creation of single-page applications (SPAs) with ease.


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
  import * as htmz from "https://www.unpkg.com/htmzjs@2.0.0/dist/index.js";

  const app = document.querySelector("#app");
  const appState = htmz.setState({ count: 0 });

  htmz.initTree({
    root: app,
    state: appState,
    actions: {
      increment(state) {
        state.count.value += 1;
      },
    }
  });
</script>
```

## License

HTMZ.js is open-source and available under the [MIT License](https://github.com/htmzjs/htmz/blob/main/LICENSE).
