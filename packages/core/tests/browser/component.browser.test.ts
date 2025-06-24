import { describe, expect, it, beforeEach } from "vitest"
import dedent from "dedent"

import * as htmz from "../../src"
import { Define, Property } from "../../src"

beforeEach(() => {
  document.body.innerHTML = ''
  const symbols = Object.getOwnPropertySymbols(customElements) as unknown as (keyof CustomElementRegistry)[]
  for (const symbol of symbols) {
    if (!(customElements[symbol] instanceof Map)) continue
    customElements[symbol].clear()
  }
})

describe("component", () => {
  it("should render component with reactive data and serialize shadowRoot content", async () => {
    document.body.innerHTML = dedent`<div @data="{comp:'MyComponent'}" @component="{comp}"></div>`

    @Define({
      template: dedent`
        <div @text="count: {inner.count}">Component</div>
    `})
    class MyComponent extends htmz.Component {
      constructor() {
        super({ serializable: true, shadowRootMode: "open", })
      }

      @Property({ count: 5 })
      declare inner: { count: number }

      override connectedCallback(): void {
        this.inner.count += 1
      }
    }

    htmz.init(document.body)
      .components({
        MyComponent: async () => {
          return MyComponent
        }
      })
      .walk()

    queueMicrotask(() => {
      const renderedResult = document.body.firstElementChild?.getHTML({ serializableShadowRoots: true })
      const expectedResult = dedent`
        <my-component><template shadowrootmode="open" shadowrootserializable=""><div @text="count: {inner.count}">count: 6</div></template></my-component>
      `
      expect(renderedResult).toBe(expectedResult)
    })

  })

  describe("should move all childNodes into the component slot", async () => {
    beforeEach(() => {
      document.body.innerHTML = dedent`
        <div @component="MyComponent">
          hello
          <p>Hello World</p>
        </div>
      `
      const symbols = Object.getOwnPropertySymbols(customElements) as unknown as (keyof CustomElementRegistry)[]
      for (const symbol of symbols) {
        if (!(customElements[symbol] instanceof Map)) continue
        customElements[symbol].clear()
      }
    })

    const template = "<div><slot></slot></div>"

    it("with shadowRootMode 'none'", () => {
      @Define({ template })
      class MyComponent extends htmz.Component {
        constructor() { super({ shadowRootMode: "none" }) }
      }

      htmz.init(document.body)
        .components({ MyComponent })
        .walk()

      const renderedResult = document.body.firstElementChild?.getHTML()
      const expectedResult = dedent`
      <my-component><div>
        hello
        <p>Hello World</p>
      </div></my-component>
    `
      expect(renderedResult).toBe(expectedResult)
    })

    it("with shadowRootMode 'open'", () => {
      @Define({ template })
      class MyComponent extends htmz.Component {
        constructor() { super({ serializable: true, shadowRootMode: "open" }) }
      }

      htmz.init(document.body)
        .components({ MyComponent })
        .walk()

      const renderedResult = document.body.firstElementChild?.getHTML({ serializableShadowRoots: true })
      const expectedResult = dedent`
      <my-component><template shadowrootmode="open" shadowrootserializable="">${template}</template>
        hello
        <p>Hello World</p>
      </my-component>
      `
      expect(renderedResult).toBe(expectedResult)
    })
  })

  it("should change component when data change and move all childNodes from previous component", () => {
    document.body.innerHTML = dedent`
      <div @component="{component}">
        textNode
        <p>ChildNode</p>
      </div>
    `

    const template = "<div><slot></slot></div>"

    @Define({ template })
    class MyComponent extends htmz.Component {
      constructor() {
        super({ serializable: true, shadowRootMode: 'open' })
      }
    }

    @Define({ template })
    class AnotherComponent extends htmz.Component {
      constructor() {
        super({})
      }
    }

    const data = htmz.observe({
      component: "MyComponent"
    })

    htmz
      .init(document.body)
      .data(data)
      .components({ MyComponent, AnotherComponent })
      .walk()

    let renderedResult = document.body.firstElementChild?.getHTML({ serializableShadowRoots: true })
    let expectedResult = dedent`
      <my-component><template shadowrootmode="open" shadowrootserializable="">${template}</template>
        textNode
        <p>ChildNode</p>
      </my-component>
    `
    expect(renderedResult).toBe(expectedResult)

    data.component = 'AnotherComponent'

    renderedResult = document.body.firstElementChild?.getHTML({ serializableShadowRoots: true })
    expectedResult = dedent`
      <another-component><div>
        textNode
        <p>ChildNode</p>
      </div></another-component>
    `
    expect(renderedResult).toBe(expectedResult)
  })
})
