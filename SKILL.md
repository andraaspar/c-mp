---
name: c-mp
description: Write or modify UI code using the c-mp frontend library (defineComponent, useState/mutateState, useEffect, Slot, Show, For, useQuery). Use whenever editing .tsx/.ts components in a project whose JSX is configured with jsxImportSource pointing at a copied-in c-mp (a src/c-mp or **/c-mp folder), or when the user mentions c-mp, defineComponent, mutateState, Slot/Show/For, or "the web component library".
---

# Working with c-mp

c-mp is a dependency-free, Web-Component-based reactive UI library (Svelte/Solid-like): proxy state, JSX compiled to real DOM (no virtual DOM), effects that auto-track their dependencies. It is distributed by **copying** `c-mp` into a project, so every import is a **relative path** to that folder — there is no npm package.

Before non-trivial work, read the library's `README.md` (the authoritative reference, usually at the repo root) and skim a couple of existing components to match local conventions. Locate the library with a glob like `**/c-mp/fun/defineComponent.ts`; imports in this skill use `./c-mp/...` as a placeholder — adjust the relative depth to the file you're editing.

## The rules that are easy to get wrong

These are the mistakes to avoid — they are not how React/Solid/Svelte work:

1. **All state writes go through `mutateState(parent, name, fn)` — three arguments.**
   `mutateState($.debugName, 'short description', () => { state.x = ... })`. Inside a component the parent is `$.debugName`; at module scope use the function name. Writing state outside `mutateState` logs `👾 Unlabeled mutation!`.

2. **There is no `{() => x}` text interpolation.** A bare function in JSX children is appended as-is, not called. To show a reactive value use `<Slot get={() => x} />`. (Static text like `Hello` or `{props.name}` read once is fine; anything that changes over time needs `Slot`.)

3. **`props` never change.** A component's setup function runs exactly once. To pass something reactive across a component boundary, pass a **getter**: `getPerson: () => IPerson`, not `person: IPerson`. The child calls `props.getPerson()` inside `Slot`/`class`/effects.

4. **`Show` conditions must be built with `$when`.** You cannot pass a raw `() => jsx`. Use `$when(() => cond, ThenComp)`; `it` takes one `$when(...)` or an array of them; optional `else`.

5. **Reactive attributes are getters.** `class={() => [...]}`, `value={() => state.x}`, `disabled={() => state.busy}`. A plain value is set once; a function becomes an effect. (Exception: don't pass functions as reactive props to nested custom elements — they're passed through.)

## Cheat sheet

```tsx
import { defineComponent } from './c-mp/fun/defineComponent'
import { mutateState, useState } from './c-mp/fun/useState'
import { useEffect } from './c-mp/fun/useEffect'
import { Slot } from './c-mp/comp/Slot'
import { $when, Show } from './c-mp/comp/Show'
import { For } from './c-mp/comp/For'

export const MyComp = defineComponent<{ getTitle: () => string }>(
  'MyComp',
  (props, $) => {
    const state = useState('state', { items: [] as string[], busy: false })

    useEffect('log count', () => {
      console.log(state.items.length) // reading state.items tracks it
    })

    return (
      <div class={() => ['card', state.busy && 'busy']}>
        <h1><Slot get={() => props.getTitle()} /></h1>

        <Show
          it={$when(() => state.items.length, () => <span>has items</span>)}
          else={() => <span>empty</span>}
        />

        <For
          debugName='items'
          each={() => state.items}
          getKey={(it) => it}
          render={({ get, getIndex, getLength }) => (
            <div>
              <Slot get={get} />
              <button
                onclick={() => {
                  mutateState($.debugName, 'remove item', () => {
                    state.items.splice(getIndex(), 1)
                  })
                }}
              >×</button>
            </div>
          )}
          empty={() => <div>No items.</div>}
        />

        <button
          onclick={() => {
            mutateState($.debugName, 'add item', () => {
              state.items.push('new')
            })
          }}
        >Add</button>
      </div>
    )
  },
)
```

### Quick reference

- `defineComponent<Props>('Name', (props, $) => JSX)` — setup runs once; `$` is the `<c-mp>` element (mainly `$.debugName`).
- `useState('name', initialObjectOrArray)` — reactive proxy. Nested objects/arrays auto-proxied; primitives/class instances pass through.
- `mutateState(parent, 'name', fn)` — wrap every write.
- `useEffect('name', fn)` — runs now, re-runs when read state changes (batched); return a cleanup fn; returns `kill()`.
- `useMemo('name', () => value)` — returns a **getter**; call it to read. Recomputes on dependency change.
- `<Slot get={() => value} isTrustedHtml? />` — reactive display. `isTrustedHtml` + the `html\`\`` tag for unescaped HTML.
- `<Show it={$when(() => c, Then) | [...]} else={Else} />` — first truthy `$when` wins; the `Then` component receives `{ get }`.
- `<For debugName each={() => arr} getKey? render={({get,getIndex,getLength}) => ...} empty? />` — keyed list; `getKey` preserves item state across reorders.
- `<ErrorBoundary try={() => ...} catch={({error, stack, reset}) => ...} />`.
- `useQuery('name', () => ({ key, params, load, isEnabled?, staleAfter?, deleteAfter? }))` → reactive `{ status, data, error, loadedAt }`. `Status` is a const enum with emoji string values (`'Loading ⌚'`, `'Loaded 📦'`, etc.). `isEnabled: !!dep` for dependent queries; `staleAfter: Infinity` for never-stale.
- `useInfiniteQuery('name', () => options)` → `[state, { loadNextPage, hasNextPage }]`; `load` gets a `page` param; response needs `hasMore`.
- `usePopover({ getMenuElem, getButtonElem })` → `{ getIsOpen, open, close, toggle }`.
- `<Icon svg={ICON_X} />` — renders an SVG string.

## Sharing state

Pick the narrowest that fits — global is not required:
1. **Props** (getter props) — parent → specific children.
2. **Context** — `$.setContext(symbolKey, value)` on an ancestor, `$.getContext(symbolKey)` on a descendant (walks up `parentComp`). Usually store a getter.
3. **Module-scope `useState`** — `export const appState = useState('appState', {...})` for genuinely app-wide state (auth, route, dataset). Mutate via `mutateState`.

## Conventions to match, not invent

- **Naming:** components end in `Comp` (e.g. `PagePersonComp`); the `defineComponent` debug name matches the export.
- **`For` vs `.map()`:** use `<For>` for dynamic/keyed lists that change at runtime; a plain `array.map(...)` in JSX is fine for static lists.
- **Mutation/effect/state names** are short human descriptions. Follow whatever extra tagging convention you see in the existing code — do not introduce one if it isn't already there.
- **Match the existing file's** import depth, quote/semicolon/indentation style, and component structure.

## Verify

There's no unit-test runner; verification is type-check + browser. After edits:
- Run the project's type-check (`npm run check` or `npx tsc --noEmit`) — it must pass.
- If iterating on behavior, the dev server (`npm run dev`, Vite/Bun) renders components in the browser; check the console for ✏️/👾/▶️ logs and `👾 Unlabeled mutation!` warnings. `cmp.setLogLevel(n)` (0–3) raises verbosity.
