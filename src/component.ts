import type { HTMZConfig, Plugins } from "./htmz";
import { effect, reactive } from "./reactive";
import { toKebabCase } from "./utils";

export interface ComponentConstructor {
  new (...params: any[]): Component<{}>;
  customElementConstructor:
    | (CustomElementConstructor & { observedAttributes: string[] })
    | null;
  observedAttributes: string[];
}

export type Components = Record<
  string,
  ComponentConstructor | (() => Promise<ComponentConstructor>)
>;

export interface Lifecycles {
  connectedCallback: {};
  disconnectedCallback: {};
  adoptedCallback: {};
  attributeChangedCallback: {
    name: string;
    oldValue: string;
    newValue: string;
  };
}

export interface ComponentConfig {
  components?: Components;
  shadowRootMode?: keyof typeof shadowRootModeMap;
  plugins?: Plugins;
  template?: string;
  deleteDirectives?: boolean;
  deleteScopes?: boolean;
  serializable?: boolean;
}

const defaultComponentConfig: ComponentConfig = {
  components: {},
  shadowRootMode: "closed",
  plugins: {},
  template: "",
  deleteDirectives: true,
  deleteScopes: true,
  serializable: false,
};

const shadowRootModeMap = {
  closed: function (element: HTMLElement, serializable: boolean) {
    return element.attachShadow({ mode: "closed", serializable });
  },
  open: function (element: HTMLElement, serializable: boolean) {
    return element.attachShadow({ mode: "open", serializable });
  },
  none: function (element: HTMLElement) {
    return element;
  },
};

export class Component<State extends {}> {
  static customElementConstructor:
    | (CustomElementConstructor & { observedAttributes: string[] })
    | null = null;

  static components: Components = {};

  static observedAttributes: string[] = [];

  root: HTMLElement | ShadowRoot | null = null;

  host: HTMLElement | null = null;

  state: State = {} as State;

  lifecycles: Lifecycles = {
    connectedCallback: {},
    disconnectedCallback: {},
    adoptedCallback: {},
    attributeChangedCallback: {
      name: "",
      oldValue: "",
      newValue: "",
    },
  };

  reactiveLifecycles: Lifecycles = reactive(this.lifecycles);

  shadowRootMode: keyof typeof shadowRootModeMap;

  serializable;

  template;

  plugins;

  _config: HTMZConfig = {};

  constructor(config: ComponentConfig = defaultComponentConfig) {
    Component.components = {
      ...Component.components,
      ...(config.components ?? {}),
    };

    this.shadowRootMode = config.shadowRootMode ?? "closed";
    this.serializable = config.serializable ?? false;
    this.template = config.template ?? "";
    this.plugins = config.plugins ?? {};
    this._config = {
      deleteDirectives: config.deleteDirectives,
      deleteScopes: config.deleteScopes,
    };

    const initLifecycles = new WeakMap();

    effect(() => {
      this.reactiveLifecycles.connectedCallback;
      if (!initLifecycles.has(this.connectedCallback)) {
        initLifecycles.set(this.connectedCallback, null);
        return;
      }
      this.connectedCallback();
    });
    effect(() => {
      this.reactiveLifecycles.disconnectedCallback;
      if (!initLifecycles.has(this.disconnectedCallback)) {
        initLifecycles.set(this.disconnectedCallback, null);
        return;
      }
      this.disconnectedCallback();
    });
    effect(() => {
      this.reactiveLifecycles.adoptedCallback;
      if (!initLifecycles.has(this.adoptedCallback)) {
        initLifecycles.set(this.adoptedCallback, null);
        return;
      }
      this.adoptedCallback();
    });
    effect(() => {
      const v = this.reactiveLifecycles.attributeChangedCallback;
      if (!initLifecycles.has(this.attributeChangedCallback)) {
        initLifecycles.set(this.attributeChangedCallback, null);
        return;
      }
      this.attributeChangedCallback(v.name, v.oldValue, v.newValue);
    });
  }

  init() {}

  connectedCallback() {}

  disconnectedCallback() {}

  adoptedCallback() {}

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {}

  static create(componentConstructor: ComponentConstructor): Component<{}> {
    const component = new componentConstructor();

    if (!componentConstructor.customElementConstructor) {
      componentConstructor.customElementConstructor = class extends (
        HTMLElement
      ) {
        static observedAttributes: string[] = [];

        reactiveLifecycles;

        constructor(component: Component<{}>) {
          super();
          this.reactiveLifecycles = component.reactiveLifecycles;
          component.host = this;
          component.root = shadowRootModeMap[component.shadowRootMode](
            this,
            component.serializable
          );
          component.root.setHTMLUnsafe(component.template);
          componentConstructor.customElementConstructor!.observedAttributes =
            componentConstructor.observedAttributes;
          component.init();
        }

        connectedCallback() {
          this.reactiveLifecycles.connectedCallback = {};
        }

        disconnectedCallback() {
          this.reactiveLifecycles.disconnectedCallback = {};
        }

        adoptedCallback() {
          this.reactiveLifecycles.adoptedCallback = {};
        }

        attributeChangedCallback(
          name: string,
          oldValue: string,
          newValue: string
        ) {
          this.reactiveLifecycles.attributeChangedCallback = {
            name,
            oldValue,
            newValue,
          };
        }
      };

      customElements.define(
        toKebabCase(component.constructor.name),
        componentConstructor.customElementConstructor
      );
    }
    new componentConstructor.customElementConstructor!(component);
    return component;
  }
}
