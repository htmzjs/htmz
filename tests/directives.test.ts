import { describe, expect, test } from "vitest";
import * as htmz from "../src";

describe("Directives", () => {
  test("data-for", () => {
    const div = document.createElement("div");
    div.innerHTML = /*html*/ `
      <template data-for="animal in ['cat','tiger','eagle']">
        <div data-text="this.animal"></div>
      </template>`;

    htmz.init(div).walk();

    expect(div.innerHTML).toBe(/*html*/ `
      <template>
        <div data-text="this.animal"></div>
      </template><div>cat</div><div>tiger</div><div>eagle</div>`);
  });

  test("data-range", () => {
    const div = document.createElement("div");
    div.innerHTML = /*html*/ `
      <template data-range="3">
        <div data-text="this.$index"></div>
      </template>`;

    htmz.init(div).walk();

    expect(div.innerHTML).toBe(/*html*/ `
      <template>
        <div data-text="this.$index"></div>
      </template><div>0</div><div>1</div><div>2</div>`);
  });

  test("nested data-range, this.$index should return index from 0 to total loop", () => {
    const div = document.createElement("div");
    div.innerHTML = /*html*/ `
      <div data-state="{x:3, y:3}">
        <template data-range="this.y">
          <div>
            <template data-range="this.x">
              <div data-:id="this.$index" data-text="this.$index"></div>
            </template>
          </div>
        </template>
      </div>`;

    htmz.init(div).walk();

    const result = document.createElement("div");
    result.innerHTML = /*html*/ `
      <div>
        <template>
          <div>
            <template data-range="this.x">
              <div data-:id="this.$index" data-text="this.$index"></div>
            </template>
          </div>
        </template>
      </div>`;

    let i = 0;
    while (i < 3) {
      const div = document.createElement("div");
      div.innerHTML = /*html*/ `
            <template>
              <div data-:id="this.$index" data-text="this.$index"></div>
            </template>
          `;

      let j = 0;
      while (j < 3) {
        const $index = i * 3 + j;
        div.innerHTML += /*html*/ `<div id="${$index}">${$index}</div>`;
        j++;
      }

      result.firstElementChild!.appendChild(div);
      i++;
    }

    expect(div.innerHTML).toBe(result.innerHTML);
  });

  test("data-:[attribute]", () => {
    const div = document.createElement("div");
    div.innerHTML = /*html*/ `
      <template data-range="3">
        <div data-:id="this.$index">item</div>
      </template>`;

    htmz.init(div).walk();

    expect(div.innerHTML).toBe(/*html*/ `
      <template>
        <div data-:id="this.$index">item</div>
      </template><div id="0">item</div><div id="1">item</div><div id="2">item</div>`);
  });
});
