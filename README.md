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
      increment({rootState}) {
        rootState.count.value += 1;
      },
    }
  });
</script>
```

## Reactive Data Binding Attributes

### `data-text`

**Description:**  
Binds an element’s text content to a **single state property**. The value inside `${}` is automatically updated whenever the referenced state changes.  

**Behavior:**
- The `${}` placeholder must contain exactly **one state property** (e.g., `${count}`).  
- When the referenced state changes, the element's text updates automatically.  
- ${count + 1} or ${user.name} it work but element not update when state change, another way is use **`data-watch`** to update element.

**Example:**
```html
  <div data-text="Count: ${count}, Total: ${total}"></div>
```

### `data-watch`

**Description:**  
Defines multiple state dependencies for an element. When any of the listed states change, the element updates accordingly.

**Behavior:**
- Accepts **one or more state properties**, separated by commas (e.g., `data-watch="count,total"`).  
- The element updates whenever **any** of the listed state properties change.  

**Example:**
```html
  <div data-text="Count: ${count + 1}, Total: ${total}" data-watch="count"></div>
```

### `data-state`

**Description:**  
The `data-state` attribute allows defining **local state** directly within an HTML element. It behaves like a variable with **element-scoped reactivity**, meaning only the element itself and its child elements can access it. If a state variable inside `data-state` has the same name as an outer state, it creates **shadowing**, meaning the inner state takes precedence within that element's scope.

**Behavior:**
- **Scoped State**: data-state is only accessible within the element and its children.
- **Shadowing**: If a state inside data-state has the same name as a global state, the local state is used within its scope.

**Example:**
```html
  <div data-state="{ msg: 'hello world'}"
    <div data-text="${msg}"></div>
  </div>
```

### `data-component`

**Description:**  

**Behavior:**
- The value of data-component should match the component key defined in initTree. 
- [Component](./src/htmz.ts) class names are automatically converted to kebab-case when registered as custom elements.

**Example:**
```html
  <div id="root">
    <div data-component="counter"></div>
  </div>

  <script>
    import * as htmz from "htmzjs"

    class CounterComponent extends htmz.Component {
      static state = htmz.setState({ count: 0 })
      static actions = {
        increment: function({state, rootState}){
          rootState.count.value += 1
        }
      }
      constructor(){
        super({
          shadowRootMode: "closed",
          template: `
            <button data-onclick="increment">Increment</button>
            <div data-text="Count: \${count}"></div>
          `
        })
      }
    }

    const root = document.querySelector("#root")
    htmz.initTree({ root, components: { counter: CounterComponent }})
  </script>
```

### `data-for`

**Example:**
```html
  <li data-state="{ animals: ['cat', 'tiger', 'eagle'] }">
    <template data-watch="animals" data-for="animal in animals">
      <li data-text="${animal} in index ${$key}"></li>
    </template>
  </li>
```

### `data-range`

**Example:**
```html
  <div data-state="{x:3, y:3}">
    <template data-range="y as i">
      <div>
        <template data-range="x">
          <h1 data-text="${index}"></h1>
        </template>
      </div>
    </template>
  </div>
```

### `data-model`

**Example:**
```html
  <form data-state="{content:''}">
    <input data-model="content" name="content" target="content" type="text">
  </form>
```

### `data-if`

**Example:**
```html
  <div data-watch="show" data-if="true; toggleHidden()" hidden>
    Content
  </div>

  <script>
    htmz.initTree({root,state, actions: {
      toggleHidden: function({state}){
        return () => {
          this.hidden = !this.hidden
        }
      }
    }})
  </script>
```

## API Reference

### `setState(data)`

**Description:**
Creates a new application state based on the provided data. 

**Parameters:**
- **`data`** (`object`): An object representing the initial state.

**Returns:** 
A new state object.

**Example:**
```javascript
const state = htmz.setState({ count: 0 })
```

### `initTree(config)`

**Description:**  
Initializes the DOM traversal using the TreeWalker API and configures the application's state, actions, plugins, and components. This function serves as the core setup mechanism, ensuring that all elements in the DOM are properly initialized and reactive.

**Parameters:**
- **`config`** (`object`): 

**Returns:** 
`void`.

**Example:**
```javascript
  const app = document.querySelector("#app");
  const appState = htmz.setState({ count: 0 });

  htmz.initTree({
    root: app,
    state: appState,
    actions: {
      increment({state, rootState, event}) {
        rootState.count.value += 1
      },
    },
  });
```

## License

HTMZ.js is open-source and available under the [MIT License](./LICENSE).
