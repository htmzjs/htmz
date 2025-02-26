import { Component, type ComponentConstructor } from "./component";
import { init, type Plugins } from "./htmz";
import { effect, reactive } from "./reactive";
import { isFunction, matchDynamicRoute } from "./utils";

export type Params = Record<string, unknown>;

export type Path = `/${string}`;

export type Routes = Record<
  Path,
  {
    component:
      | ComponentConstructor
      | ((this: { params: Params }) => Promise<ComponentConstructor>);
    params?: Params;
  }
>;

class Router {
  static components: {
    view?: ComponentConstructor | (() => Promise<ComponentConstructor>);
  } = reactive({});

  static params: {};

  static plugins: Plugins = {
    routerView: function ({ plugins, element, config, scopes, rootState }) {
      effect(async function () {
        let componentConstructor = Router.components
          .view as ComponentConstructor;

        if (isFunction(componentConstructor)) {
          componentConstructor = await (componentConstructor as Function)();
        }

        const component = Component.create(componentConstructor);

        init(component.root!)
          .state(rootState, ...(scopes ?? []), component.state, {
            $params: Router.params,
          })
          .plugins({ ...plugins, ...component.plugins })
          .config({ ...config, ...component._config })
          .components(Component.components)
          .walk();

        element.replaceChildren(component.host!);
      });
    },
  };

  static routes: Routes = {};

  static state = {};

  static app: Component<{}>;

  constructor(app: ComponentConstructor) {
    Router.app = Component.create(app);
  }

  state(data: {}) {
    Router.state = data;
    return this;
  }

  routes(routes: Routes) {
    Router.routes = routes;
    return this;
  }

  plugins(plugins: Plugins) {
    Router.plugins = { ...Router.plugins, ...plugins };
    return this;
  }

  components(
    components: Record<
      string,
      ComponentConstructor | (() => Promise<ComponentConstructor>)
    >
  ) {
    Router.components = components;
    return this;
  }

  mount(selectors: string | Element) {
    const root =
      selectors instanceof Element
        ? selectors
        : document.querySelector(selectors)!;

    root.appendChild(Router.app.host!);

    Router.navigate(location.pathname as Path);

    init(Router.app.root!)
      .config(Router.app._config)
      .state({ $navigate: navigate }, Router.state, Router.app.state)
      .plugins({ ...Router.plugins, ...Router.app.plugins })
      .components(Component.components)
      .walk();

    window.addEventListener("popstate", (e) => {
      const path = location.pathname as Path;
      Router.navigate(path, null, "none");
    });
  }

  private static navigateType = {
    replace(path: Path, data: unknown) {
      history.replaceState(data, "", path);
    },
    push(path: Path, data: unknown) {
      history.pushState(data, "", path);
    },
    back() {
      history.back();
    },
    none() {},
  };

  static navigate(
    path?: Path,
    data: unknown = null,
    type: keyof typeof Router.navigateType = "push"
  ) {
    const route =
      Router.routes[path as Path]! ?? matchDynamicRoute(Router.routes, path);

    Router.params = route.params ?? {};

    Router.components.view = isFunction(route.component)
      ? (route.component as Function).bind({ params: route.params })
      : route.component;

    Router.navigateType[type](path!, data);
  }
}

export function initRouter(app: ComponentConstructor) {
  return new Router(app);
}

export function navigate(url?: Path, data: unknown = null) {
  Router.navigate(url, data);
}
