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
        if (!componentConstructor) return;

        if (isFunction(componentConstructor)) {
          componentConstructor = await (componentConstructor as Function)();
        }

        const component = Component.create(componentConstructor);

        init(component.root!, Router.win)
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

  static doc: Document;

  static win: Window;

  constructor(app: ComponentConstructor, win: Window = window) {
    Router.win = win;
    Router.doc = Router.win.document;
    Component.win = Router.win;
    Component.doc = Router.doc;
    Router.app = Component.create(app);

    init(Router.app.root!, Router.win)
      .config(Router.app._config)
      .state({ $navigate: navigate }, Router.state, Router.app.state)
      .plugins({ ...Router.plugins, ...Router.app.plugins })
      .components(Component.components)
      .walk();
  }

  routes(routes: Routes) {
    Router.routes = routes;
    return this;
  }

  mount(selectors: string | Element) {
    const root =
      selectors instanceof Element
        ? selectors
        : Router.doc.querySelector(selectors)!;

    root.appendChild(Router.app.host!);

    Router.navigate(Router.win.location.pathname as Path);

    Router.win.addEventListener("popstate", (e) => {
      const path = Router.win.location.pathname as Path;
      Router.navigate(path, null, "none");
    });
  }

  private static navigateType = {
    replace(path: Path, data: unknown) {
      Router.win.history.replaceState(data, "", path);
    },
    push(path: Path, data: unknown) {
      Router.win.history.pushState(data, "", path);
    },
    back() {
      Router.win.history.back();
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

export function initRouter(app: ComponentConstructor, win: Window = window) {
  return new Router(app, win);
}

export function navigate(url?: Path, data: unknown = null) {
  Router.navigate(url, data);
}
