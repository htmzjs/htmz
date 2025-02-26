import { type Plugins } from "./htmz";
import { effect } from "./reactive";
import { createScopedState, evaluate } from "./utils";

export const globalEventHandlersEvents: (keyof GlobalEventHandlersEventMap)[] =
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

export function createEventHandlers(
  events: (keyof GlobalEventHandlersEventMap)[]
) {
  return events.reduce<Plugins>((events, event) => {
    return {
      ...events,
      [`on${event}`]: function ({ element, scopes, rootState }) {
        const value = element.dataset[`on${event}`] ?? "";

        const handler = (e: Event) => {
          evaluate(value).bind(
            createScopedState([rootState, ...scopes, { $event: e }])
          )();
        };

        let cleanup: (() => void) | null = null;

        effect(function () {
          if (cleanup) cleanup();
          element.addEventListener(event, handler);
        });

        cleanup = () => {
          element.removeEventListener(event, handler);
        };
      },
    };
  }, {});
}
