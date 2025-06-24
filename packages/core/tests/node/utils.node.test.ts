import { describe, it, expect } from "vitest"
import { interpolate, parseFunctionCall } from "../../src/utils"


describe("utils", async () => {
  it("should parse function name and arguments and interpolate string argument", () => {
    const str = `sayHello("john doe", {name:"john"}, "{name}")`
    const [name, args] = parseFunctionCall(str)

    const result = {
      name,
      args: args.map(v => typeof v === "string"
        ? interpolate(v, { name: 'john' }) : v)
    }

    const expectedResult = {
      name: 'sayHello',
      args: ["john doe", { name: 'john' }, 'john']
    }
    expect(result).toEqual(expectedResult)
  })
})
