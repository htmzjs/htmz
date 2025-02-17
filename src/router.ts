import { initTree, type ComponentConstructor, type Plugins } from "./htmz";
import { setState, type Actions, type State } from "./state";
import { matchUrlToDynamicRoute, toKebabCase } from "./utils";

export interface RouterConfig<T extends State<{}>> {
  app: ComponentConstructor;
  state?: T;
  actions?: Actions<T>;
  components?: Record<
    string,
    ComponentConstructor | (() => Promise<ComponentConstructor>)
  >;
  plugins?: Plugins;
}

export interface Route {
  path: string;
  component: ComponentConstructor | (() => Promise<ComponentConstructor>);
  params?: Record<string, string>;
}

export type Routes = Record<string, Route>;

export function createRoutes(routes: Route[]): Routes {
  return routes.reduce((routes, route) => {
    return { ...routes, [route.path]: route };
  }, {});
}

export class Router<T extends State<{}>> {
  app;
  root!: HTMLElement | ShadowRoot;
  state;
  actions;
  components;
  plugins;
  routes: Record<string, Route> = {};
  constructor({
    app,
    state = {} as T,
    actions = {},
    components = {},
    plugins,
  }: RouterConfig<T>) {
    this.app = app;
    this.state = state;
    this.actions = actions;
    this.components = components;
    this.plugins = plugins;
  }

  setRoutes(routes: Route[]) {
    this.routes = routes.reduce((routes, route) => {
      return { ...routes, [route.path]: route };
    }, {});
    return this;
  }

  createApp(root: Element) {
    customElements.define(toKebabCase(this.app.name), this.app);
    root.appendChild(new this.app());

    this.root = this.app.root!;
    this.app.root = null;

    this.navigateTo(location.pathname);

    window.addEventListener("popstate", () => {
      this.navigateTo(location.pathname);
    });
  }

  matchDynamicRoute(url?: string): Route | null {
    if (!url) return null;

    for (const [, route] of Object.entries(this.routes)) {
      const value = matchUrlToDynamicRoute(url, route);
      if (!value) continue;
      return value;
    }

    return null;
  }

  navigateTo(url?: string, data: unknown = null) {
    const route = this.routes[url || "/"]! ?? this.matchDynamicRoute(url);
    this.components["router-outlet"] = route.component;

    const { $params } = setState({ $params: route.params });

    initTree({
      root: this.root,
      state: { ...this.state, $params },
      actions: this.actions,
      components: this.components,
      plugins: this.plugins,
    });

    history.pushState(data, "", url);
  }
}

export function createRouter<T extends State<{}>>(config: RouterConfig<T>) {
  return new Router(config);
}
