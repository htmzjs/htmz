import { interpolate } from "../utils"
import type { Directives } from "."

export default {
  text: ({ element, watch, value, scopedState }) => {
    watch(() => {
      const result = interpolate(value, scopedState)
      element.textContent = result
    })
  }
} as Directives

