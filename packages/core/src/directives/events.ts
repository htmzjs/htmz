import { createScopedState, parseFunctionCall } from "../utils";
import type { Directives } from ".";

const globalEvents: (keyof GlobalEventHandlersEventMap)[] =
  [
    "abort",
    "animationcancel",
    "animationend",
    "animationiteration",
    "animationstart",
    "auxclick",
    "beforeinput",
    "beforetoggle",
    "blur",
    "cancel",
    "canplay",
    "canplaythrough",
    "change",
    "click",
    "close",
    "compositionend",
    "compositionstart",
    "compositionupdate",
    "contextlost",
    "contextmenu",
    "contextrestored",
    "copy",
    "cuechange",
    "cut",
    "dblclick",
    "drag",
    "dragend",
    "dragenter",
    "dragleave",
    "dragover",
    "dragstart",
    "drop",
    "durationchange",
    "emptied",
    "ended",
    "error",
    "focus",
    "focusin",
    "focusout",
    "formdata",
    "gotpointercapture",
    "input",
    "invalid",
    "keydown",
    "keypress",
    "keyup",
    "load",
    "loadeddata",
    "loadedmetadata",
    "loadstart",
    "lostpointercapture",
    "mousedown",
    "mouseenter",
    "mouseleave",
    "mousemove",
    "mouseout",
    "mouseover",
    "mouseup",
    "paste",
    "pause",
    "play",
    "playing",
    "pointercancel",
    "pointerdown",
    "pointerenter",
    "pointerleave",
    "pointermove",
    "pointerout",
    "pointerover",
    "pointerup",
    "progress",
    "ratechange",
    "reset",
    "resize",
    "scroll",
    "scrollend",
    "securitypolicyviolation",
    "seeked",
    "seeking",
    "select",
    "selectionchange",
    "selectstart",
    "slotchange",
    "stalled",
    "submit",
    "suspend",
    "timeupdate",
    "toggle",
    "touchcancel",
    "touchend",
    "touchmove",
    "touchstart",
    "transitioncancel",
    "transitionend",
    "transitionrun",
    "transitionstart",
    "volumechange",
    "waiting",
    "webkitanimationend",
    "webkitanimationiteration",
    "webkitanimationstart",
    "webkittransitionend",
    "wheel",
  ];

export default globalEvents.reduce<Directives>((events, event) => {
  return Object.assign<Directives, Directives>(events, {
    [`on${event}`]({ element, value, scopes, rootState, watch }) {

      const handler = (e: Event) => {
        const scopedState = createScopedState([rootState, ...scopes, { $event: e, $e: e }])
        const [fnName, fnArgs] = parseFunctionCall(value)
        const fn = scopedState[fnName as keyof object] as VoidFunction
        if (fn) fn.apply(scopedState, fnArgs)
      };

      let cleanup: VoidFunction | null = null

      watch(() => {
        if (cleanup) cleanup()
        element.addEventListener(event, handler);
      });

      cleanup = () => {
        element.removeEventListener(event, handler);
      }
    },
  })
}, {})

