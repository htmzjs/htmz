import { initTree, type ComponentConstructor, type Plugins } from "./htmz";
import { setState, type Actions, type State } from "./state";
import { matchDynamicRoute, toKebabCase } from "./utils";

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
    Router.actions = actions as Actions<{}>;
    Router.components = components;
    Router.plugins = plugins;
  }

  setRoutes(routes: Route[]) {
    Router.routes = routes.reduce((routes, route) => {
      return { ...routes, [route.path]: route };
    }, {});
    return this;
  }

  createApp(root: Element) {
    customElements.define(toKebabCase(this.app.name), this.app);
    root.appendChild(new this.app());

    Router.root = this.app.root!;
    this.app.root = null;

    Router.navigateTo(location.pathname);

    window.addEventListener("popstate", () => {
      Router.navigateTo(location.pathname);
    });
  }

  static navigateTo(url?: string, data: unknown = null) {
    const route =
      this.routes[url || "/"]! ?? matchDynamicRoute(this.routes, url);
    this.components["router-outlet"] = route.component;

    const { $params, $navigateTo } = setState({
      $params: route.params,
      $navigateTo: Router.navigateTo,
    });

    function navigateTo() {
      return (url?: string, data: unknown = null) => {
        Router.navigateTo(url, data);
      };
    }

    initTree({
      root: this.root,
      state: { ...this.state, $params, $navigateTo },
      actions: { ...this.actions, navigateTo },
      components: this.components,
      plugins: this.plugins,
    });

    history.pushState(data, "", url);
  }
}

export function createRouter<T extends State<{}>>(config: RouterConfig<T>) {
  return new Router(config);
}
