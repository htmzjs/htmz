import { describe, expect, it, beforeEach } from "vitest"
import dedent from "dedent"
import * as htmz from "../../src"
// import json5 from "json5"

beforeEach(() => {
  document.body.innerHTML = ""
})

describe("core", async () => {
  it("should set textContent based on @text directive", () => {
    document.body.innerHTML = `<div @text="Hello world"></div>`

    htmz.init(document.body).walk()

    const renderedText = document.body.firstElementChild?.textContent
    const expectedText = "Hello world"
    expect(renderedText).toBe(expectedText)
  })

  it("should interpolate @text directive using parent @data context", () => {
    document.body.innerHTML = dedent`
      <div @data="{name: 'Pebrian', country: 'Indonesia'}">
        <p id="text" @text="Hello {name} from {country}"></>
      </div>
    `

    htmz.init(document.body).walk()

    const renderedText = document.querySelector("p")?.textContent
    const expectedText = "Hello Pebrian from Indonesia"
    expect(renderedText).toBe(expectedText)
  })

  it("should call function from data when @onclick is triggered", () => {
    const rootData = {
      count: 0,
      increment(this: { count: number }) {
        this.count++
      }
    }
    document.body.innerHTML = `<button @onclick="increment()" @text="{count}"></button>`

    htmz
      .init(document.body)
      .data(htmz.observe(rootData))
      .walk()

    const button = document.body.firstElementChild as HTMLButtonElement
    button.click()
    expect(button.textContent).toBe("1")
  })

  it("should inherit and override @data", () => {
    const rootData = {
      isInherited: false,
      root: true
    }

    document.body.innerHTML = dedent`
      <div @data="{ isOverrided: false, isInherited: true }">
        <div @data="{ isOverrided: true }">
          <p @text="is overrided? {isOverrided}, is inherited? {isInherited}, and is have value from root? {root}"></p>
        </div>
      </div>
    `

    htmz
      .init(document.body)
      .data(rootData)
      .walk()

    const renderedText = document.querySelector("p")?.textContent
    const expectedText = "is overrided? true, is inherited? true, and is have value from root? true"
    expect(renderedText).toBe(expectedText)
  })

  it("should render the item from @for template loop", () => {
    document.body.innerHTML = dedent`
      <ul>
        <template @for="animal in ['cat','husky']">
          <li @text="{animal}">item</li>
        </template>
      </ul>
    `

    htmz.init(document.body).walk()
    document.querySelector("template")?.remove()

    const renderedResult = document.body.firstElementChild?.innerHTML
    const expectedResult = `<li @text="{animal}">cat</li><li @text="{animal}">husky</li>`
    expect(dedent(renderedResult ?? '')).toBe(expectedResult)
  })

  it("should render the item with the given @range", () => {
    document.body.innerHTML = dedent`
      <ul>
        <template @range="2 as x">
          <li @text="{x}">item</li>
        </template>
      </ul>
    `

    htmz.init(document.body).walk()
    document.querySelector("template")?.remove()

    const renderedResult = document.body.firstElementChild?.innerHTML
    const expectedResult = `<li @text="{x}">0</li><li @text="{x}">1</li>`
    expect(dedent(renderedResult ?? '')).toBe(expectedResult)
  })

  it("should conditionally render and toggle visibility using @if and method call", () => {
    const rootData = {
      show() {
        const p = document.querySelector("p") as HTMLElement
        p.hidden = !p.hidden
      }
    }

    document.body.innerHTML = dedent`
      <div @if="5 < 10; show()">
        <p hidden>hello world</p>
      </div>
    `

    htmz
      .init(document.body)
      .data(rootData)
      .walk()

    const renderedResult = document.body.firstElementChild?.innerHTML
    const expectedResult = "<p>hello world</p>"
    expect(dedent(renderedResult ?? '')).toBe(expectedResult)
  })

  /*
  it("should set textContent only when data change", () => {
    const rootData = htmz.observe({
      isChanged: false
    })

    document.body.innerHTML = dedent`
      <div>
        <p @text="data is change?: {isChanged}"></p>
      </div>
    `

    htmz
      .init(document.body, { first: false })
      .data(rootData)
      .walk()

    const p = document.querySelector("p")

    let renderedText = p?.textContent
    let expectedText = ""
    expect(renderedText).toBe(expectedText)

    rootData.isChanged = true

    renderedText = document.querySelector("p")?.textContent
    expectedText = "data is change?: true"
    expect(renderedText).toBe(expectedText)
  })
  */
})

