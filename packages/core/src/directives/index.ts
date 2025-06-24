import type { Components } from "../component";
import type { State, watch } from "../reactive";
import type { ScopedState } from "../utils";

export type Directive = (options: {
  element: HTMLElement;
  value: string;
  scopedState: ScopedState;
  rootState: State;
  scopes: State[];
  directives: Directives;
  components: Components;
  watch: typeof watch
}) => void;

export type Directives = Record<string, Directive>

export const directives: Directives = {}

const directiveModules = import.meta.glob(["./*.ts", "!./index.ts"], { import: "default", eager: true }) as Record<string, Directives>

for (const key in directiveModules) Object
  .assign(directives, directiveModules[key])
