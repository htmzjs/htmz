![<!> htmz](./htmz.png)

# HTMZ.js

Enhance your HTML with seamless reactivity!  
A lightweight library for building dynamic web interfaces and single-page applications.

---

- ⚡ Lightweight and fast
- 🧠 Reactive data updates
- 📝 Declarative binding
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
      this.count++
    }
  });

  htmz.watch(() => {
    console.log(data.count);
  });

  htmz.init("#app").data(data).walk();
</script>
```

### Building Single-Page Applications

```html
<!-- index.html -->
<div id="app"></div>

<script type="module">
  import * as htmz from "@htmzjs/core";
  import {Define} from "@htmzjs/core"
  import {initRouter} from "@htmzjs/router"

  @Define({
    template: `
      <header>
        <h1>Hello World</h1>
      </header>
      <main @router-view></main>
    `,
  })
  class AppRoot extends htmz.Component {
    constructor() {
      super();
    }
  }

  @Define()
  class HomePage extends htmz.Component {
    constructor() {
      super({
        template: `<div>Welcome to the Home Page!</div>`,
      });
    }
  }

  htmz
    .initRouter(AppRoot)
    .routes({
      "/": {
        component: HomePage,
      },
    })
    .mount("#app");
</script>
```

---

## License

HTMZ.js is open-source and available under the [MIT License](./LICENSE).

---
