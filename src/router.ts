import { initTree, type ComponentConstructor, type Plugins } from "./htmz";
import { setState, type Actions, type State } from "./state";
import { matchDynamicRoute, toKebabCase } from "./utils";

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

export class Router<T extends State<{}>> {
  app;
  static root: HTMLElement | ShadowRoot;
  static state: State<{}>;
  static actions: Actions<{}>;
  static components: Record<
    string,
    ComponentConstructor | (() => Promise<ComponentConstructor>)
  >;
  static plugins?: Plugins;
  static routes: Routes = {};
  constructor({
    app,
    state = {} as T,
    actions = {},
    components = {},
    plugins,
  }: RouterConfig<T>) {
    this.app = app;
    Router.state = state;
    Router.actions = {
      ...actions,
      navigateTo() {
        return (url?: string, data: unknown = null) => {
          Router.navigateTo(url, data);
        };
      },
    };
    Router.components = components;
    Router.plugins = plugins;
  }

  setState(data: {}) {
    Router.state = setState(data);
    return this;
  }

  setActions(actions: Actions<T>) {
    Router.actions = {
      ...actions,
      navigateTo() {
        return (url?: string, data: unknown = null) => {
          Router.navigateTo(url, data);
        };
      },
    };
    return this;
  }

  setRoutes(routes: Route[]) {
    Router.routes = routes.reduce((routes, route) => {
      return { ...routes, [route.path]: route };
    }, {});

    return this;
  }

  setComponents(
    components: Record<
      string,
      ComponentConstructor | (() => Promise<ComponentConstructor>)
    >
  ) {
    Router.components = components;
    return this;
  }

  setPlugins(plugins: Plugins) {
    Router.plugins = plugins;
    return this;
  }

  createApp(root: Element) {
    customElements.define(toKebabCase(this.app.name), this.app);
    root.appendChild(new this.app());

    Router.root = this.app.root!;
    this.app.root = null;

    Router.navigateTo(location.pathname);

    window.addEventListener("popstate", (e) => {
      const url = document.location.pathname;
      const route =
        Router.routes[url]! ?? matchDynamicRoute(Router.routes, url);
      Router.components["router-outlet"] = route.component;

      const { $params } = setState({
        $params: route.params,
      });

      initTree({
        root: Router.root,
        state: { ...Router.state, $params },
        actions: Router.actions,
        components: Router.components,
        plugins: Router.plugins,
      });
    });
  }

  static navigateTo(url?: string, data: unknown = null) {
    const route =
      this.routes[url || "/"]! ?? matchDynamicRoute(this.routes, url);
    this.components["router-outlet"] = route.component;

    const { $params } = setState({
      $params: route.params,
    });

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
