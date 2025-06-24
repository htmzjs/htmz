import { observe } from "./reactive";
import type { Directives } from "./directives";
import type { State } from "./reactive";

export interface ComponentConstructor {
  new(): Component;
  components: Components
  directives: Directives
  observedAttributes: string[];
}

export type Components = Record<string, ComponentConstructor | (() => Promise<ComponentConstructor>)>;

export interface ComponentConfig {
  components?: Components;
  directives?: Directives;
  serializable?: boolean;
  shadowRootMode?: "open" | "none";
  template?: string;
}

const defaultComponentConfig: ComponentConfig = {
  components: {},
  directives: {},
  serializable: false,
  shadowRootMode: "none",
  template: "",
};

export class Component extends HTMLElement {
  static components: Components = {};
  static directives: Directives = {}
  static observedAttributes: string[] = [];

  root: HTMLElement | ShadowRoot | null = null;

  constructor(config: ComponentConfig = defaultComponentConfig) {
    const { components, shadowRootMode, template, directives, serializable } = config

    super()
    const constr = this.constructor as ComponentConstructor
    constr.components = components ?? {}
    constr.directives = directives ?? {}

    if (!shadowRootMode || shadowRootMode === "none") this.root = this
    else this.root = this.attachShadow({ mode: shadowRootMode, serializable })

    this.root.innerHTML = template || ""
  }

  get data(): State {
    return observe({})
  }

  init() { return }

  connectedCallback() { return }

  disconnectedCallback() { return }

  adoptedCallback() { return }

  /* eslint-disable */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) { return }
}
