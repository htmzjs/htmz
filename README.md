![<!> htmz](./htmz.png)

# HTMZ.js

Enhance your HTML with seamless reactivity!  
A lightweight library for building dynamic web interfaces and single-page applications.

---

## Table of Contents

- [Features](#features)
- [Introduction](#introduction)
- [Installation](#installation)
- [Demo Application](#demo-application)
- [Usage](#usage)
  - [Getting Started](#getting-started)
  - [Building Single-Page Applications](#building-single-page-applications)
- [Reactive Attributes](#reactive-attributes)
- [API Reference](#api-reference)
- [Component Lifecycle](#component-lifecycle)
- [License](#license)

---

## Features

- **Declarative Data Binding:** Bind data to HTML elements for dynamic updates.
- **Simple & Lightweight:** Designed for ease of use with a minimal footprint.
- **Modern Component Architecture:** Leverages Web Components and Shadow DOM for true encapsulation.
- **Routing for Single-Page Applications:** Build SPAs with built-in routing capabilities.

---

## Introduction

HTMZ.js empowers your HTML with the capabilities of reactive programming. With its intuitive API, you can create dynamic, interactive web pages effortlessly—without the complexity or bloat of larger frameworks. The library also supports the creation of single-page applications (SPAs) with integrated routing.

---

## Installation

Install the library using Yarn or NPM:

```sh
yarn add htmzjs
# or
npm install htmzjs
```

---

## Demo Application

For a complete example of a single-page application built with HTMZ.js, check out the [HTMZ Notes App Demo](https://github.com/pebrianz/htmz-notes-app) repository.

---

## Usage

### Getting Started

The following example demonstrates how to start with HTMZ.js using reactive state:

```html
<div id="app">
  <button data-onclick="this.count++">Increment</button>
  <div data-text="'Count: ' + this.count"></div>
</div>

<script defer type="module">
  import * as htmz from "https://www.unpkg.com/htmzjs@3.0.0/dist/index.js";

  const state = htmz.reactive({ count: 0 });

  htmz.effect(() => {
    console.log(state.count);
  });

  htmz.init("#app").state(state).walk();
</script>
```

### Building Single-Page Applications

HTMZ.js offers built-in routing to facilitate SPA development. Below is a basic example:

```html
<!-- index.html -->
<div id="app"></div>

<script type="module">
  import * as htmz from "htmzjs";

  class AppRoot extends htmz.Component {
    constructor() {
      super({
        template: `
          <header>
            <h1>Hello World</h1>
          </header>
          <main data-router-view></main>
        `,
      });
    }
  }

  class HomePage extends htmz.Component {
    constructor() {
      super({
        template: `<div>Welcome to the Home Page!</div>`,
      });
    }
  }

  htmz
    .initRouter(AppRoot)
    .router({
      "/": {
        component: HomePage,
      },
    })
    .mount("#app");
</script>
```

---

[example build single page applications](https://github.com/pebrianz/htmz-notes-app)

## Reactive Attributes

### `data-state`

**Description:**  
The `data-state` attribute allows you to define local state directly within an HTML element. This state is scoped to the element and its children. If a state variable defined in `data-state` shares the same name as a global state, the local state takes precedence (shadowing).

**Example:**

```html
<div data-state="{ count: 0 }">
  <div data-text="this.count"></div>
</div>
```

---

### `data-component`

**Description:**  
The `data-component` attribute is used to insert a pre-defined component into the HTML. The attribute's value must match the component key registered using the `htmz.init().component({ ... })` method.

**Behavior:**

- Supports local state management within each component for reactive updates.

**Example:**

```html
<div id="app">
  <div data-component="counter"></div>
</div>

<script type="module">
  import * as htmz from "htmzjs";

  class CounterComponent extends htmz.Component {
    state = htmz.reactive({
      count: 0,
      increment() {
        this.count++;
      },
    });

    constructor() {
      super({
        template: `
          <button data-onclick="increment">Increment</button>
          <div data-text="'Count: ' + this.count"></div>
        `,
      });
    }
  }

  htmz.init("#app").component({ counter: CounterComponent }).walk();
</script>
```

---

### `data-for`

**Description:**  
The `data-for` attribute is used to iterate over an array or object, generating repeated elements based on the provided data.

**Example:**

```html
<ul data-state="{ animals: ['cat', 'tiger', 'eagle'] }">
  <template data-for="animal in animals">
    <li data-text="this.animal + ' in index ' + this.$key"></li>
  </template>
</ul>
```

---

### `data-range`

**Description:**  
The `data-range` attribute allows iteration over a range of numbers or an array, supporting nested loops for grid or matrix structures.

**Example:**

```html
<div data-state="{ x: 3, y: 3 }">
  <template data-range="y as i">
    <div>
      <template data-range="x">
        <h1 data-:id="this.$index"></h1>
      </template>
    </div>
  </template>
</div>
```

---

### `data-model`

**Description:**  
The `data-model` attribute connects form elements (such as inputs and textareas) to a reactive state, ensuring that any change in the form automatically updates the corresponding state.

**Example:**

```html
<form
  data-onsubmit="this.submit(this.form)"
  data-state="{ form: { title: 'Untitled', content: 'Default value' } }"
>
  <label for="title">
    <input data-model="this.form.title" name="title" type="text" />
  </label>
  <label for="content">
    <textarea data-model="this.form.content" name="content"></textarea>
  </label>
  <button type="submit">Submit</button>
</form>
```

---

### `data-on[event]`

**Description:**  
This attribute is used to bind event handlers to HTML elements. For example, `data-onclick` binds a click event to the element.

**Example:**

```html
<button data-onclick="console.log('click')">Click</button>
```

---

### `data-:[attribute]`

**Description:**  
The `data-:[attribute]` attribute enables dynamic binding to HTML attributes. For instance, you can dynamically update an element's `id`, `class`, or any other attribute based on reactive state.

**Example:**

```html
<div data-:id="this.dynamicId" data-:class="this.dynamicClass">Content</div>
```

---

### `data-if`

**Description:**  
The `data-if` attribute is used for conditional rendering of elements based on specified logic. Elements can be shown or hidden based on the condition provided.

**Example:**

```html
<div
  data-if="this.show = true; this.$element.hidden = !this.$element.hidden"
  hidden
>
  Content
</div>
```

---

## API Reference

### `reactive(target)`

**Description:**  
Wraps the provided `target` object in a proxy to monitor changes, triggering re-renders of bound elements when state updates occur.

**Parameters:**

- **`target`** (`object`): The object to be made reactive.

**Example:**

```javascript
const state = htmz.reactive({ count: 0 });
```

---

### `effect(fn)`

**Description:**  
Registers a reactive function that re-executes whenever the state used within the function changes.

**Parameters:**

- **`fn`** (`() => void`): The function to execute when state changes occur.

**Example:**

```javascript
const state = htmz.reactive({ count: 0 });

htmz.effect(() => {
  console.log(state.count);
});

state.count++;
```

---

### `init(selectors)`

**Description:**  
Initializes HTMZ.js on the selected element, linking reactive state, components, and attributes to that element.

**Parameters:**

- **`selectors`** (`string | Node`): A CSS selector or Node representing the root element for initialization.

**Example:**

```javascript
const app = document.querySelector("#app");
const appState = htmz.reactive({ count: 0 });

htmz.init(app).state(appState).walk();
```

---

### `initRouter(app)`

**Description:**  
Initializes a SPA with routing by combining a root component with a routing configuration to manage navigation between pages.

**Parameters:**

- **`app`** (`componentConstructor`): The root component of the application.

**Example:**

```javascript
import * as htmz from "htmzjs";

class AppRoot extends htmz.Component {
  constructor() {
    super({
      template: `
        <header>
          <h1>Hello World</h1>
        </header>
        <main data-router-view></main>
      `,
    });
  }
}

class HomePage extends htmz.Component {
  constructor() {
    super({
      template: `<div>Welcome to the Home Page!</div>`,
    });
  }
}

htmz
  .initRouter(AppRoot)
  .router({
    "/": {
      component: HomePage,
    },
  })
  .mount("#app");
```

---

## Component Lifecycle

HTMZ.js components extend the standard Web Components lifecycle with an additional `init()` method. The following lifecycle hooks are available:

- **`init()`**  
  Called immediately after the component is created (i.e., after the class constructor) but before the `connectedCallback()`. Use this method for any initialization tasks that must occur early in the component's lifecycle.
- **`connectedCallback()`**  
  Called when the component is appended to the DOM.
- **`disconnectedCallback()`**  
  Called when the component is removed from the DOM.
- **`adoptedCallback()`**  
  Called when the component is moved to a new document.
- **`attributeChangedCallback(name, oldValue, newValue)`**  
  Called when one of the observed attributes changes. To use this callback, define a static `observedAttributes` array in your component class that lists the attributes to watch.

**Example:**

```javascript
class MyComponent extends htmz.Component {
  // Specify which attributes to observe
  static observedAttributes = ["attr1", "attr2"];

  constructor() {
    super({
      template: `<div>My Component</div>`,
    });
    // The component instance is created here.
  }

  // Called after construction but before connectedCallback
  init() {
    console.log("Component initialized");
  }

  // Called when the component is inserted into the DOM
  connectedCallback() {
    console.log("Component connected to the DOM");
  }

  // Called when the component is removed from the DOM
  disconnectedCallback() {
    console.log("Component disconnected from the DOM");
  }

  // Called when the component is moved to a new document
  adoptedCallback() {
    console.log("Component adopted into a new document");
  }

  // Called when an observed attribute is changed
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`);
  }
}
```

---

## License

HTMZ.js is open-source and available under the [MIT License](./LICENSE).

---
