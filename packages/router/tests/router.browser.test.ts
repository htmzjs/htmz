import { describe, it, expect } from "vitest";
import dedent from "dedent";
import * as htmz from "@htmzjs/core"
import { Define, Property } from "@htmzjs/core";
import * as router from "../src"

describe("router", async () => {
  it("should render correct component for the given route", async () => {
    @Define({
      template: dedent`
        <main @router-view></main>
      `
    })
    class AppRoot extends htmz.Component {
      constructor() {
        super({ shadowRootMode: "none", serializable: true })
      }
    }

    @Define({
      template: `<h1 @text="{title}"></h1>`
    })
    class AppHome extends htmz.Component {
      @Property("Untitled")
      declare title: string

      static title = "static"

      constructor() {
        super({ shadowRootMode: "none", serializable: true })
        this.title = AppHome.title
      }
    }

    router.initRouter(AppRoot).routes({
      "/": {
        params: { title: "HomePage" },
        component: async function() {
          AppHome.title = this.params.title
          return AppHome
        },
      }
    }).mount(document.body)

    await Promise.resolve()

    const renderedResult = document.body.getHTML({ serializableShadowRoots: true })
    const expectedResult = `<app-root><main @router-view=""><app-home><h1 @text="{title}">HomePage</h1></app-home></main></app-root>`
    expect(renderedResult).toBe(expectedResult)
  })
})
