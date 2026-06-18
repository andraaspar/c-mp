# c-mp

c-mp is a small, dependency-free frontend library for building reactive user interfaces. It is built on native Web Components and uses proxy-based state for granular, fine-grained DOM updates. JSX compiles directly to real DOM elements — there is no virtual DOM.

## Features

- **Granular reactivity** via proxy state — only the DOM that depends on a changed value updates.
- **JSX, no virtual DOM** — `let element = <div>Yay!</div>` produces a real DOM node.
- **Automatic dependency tracking** — effects discover their dependencies by reading state; there are no dependency arrays.
- **Built-in data fetching** — `useQuery` and `useInfiniteQuery` with caching and staleness.
- **Web-component based** — every component is a `<c-mp>` custom element, visible in browser dev tools with no plugin required.
- **Debug-friendly** — components, state, effects, and mutations all carry debug names that appear in console logs (✏️ state, 👾 mutation, ▶️ effect) and in error stacks.

## Table of contents

- [c-mp](#c-mp)
  - [Features](#features)
  - [Table of contents](#table-of-contents)
  - [Core concepts](#core-concepts)
  - [Tradeoffs](#tradeoffs)
  - [Getting started](#getting-started)
    - [package.json](#packagejson)
    - [tsconfig.json](#tsconfigjson)
    - [Entry point](#entry-point)
  - [Components](#components)
  - [State and mutations](#state-and-mutations)
  - [Effects](#effects)
  - [Displaying values: Slot](#displaying-values-slot)
    - [Building a fragment of UI inside one Slot](#building-a-fragment-of-ui-inside-one-slot)
  - [Conditional rendering: Show](#conditional-rendering-show)
  - [Lists: For](#lists-for)
  - [Element attributes](#element-attributes)
  - [Data fetching](#data-fetching)
    - [useQuery](#usequery)
    - [useInfiniteQuery](#useinfinitequery)
  - [Error boundaries](#error-boundaries)
  - [Other built-ins and utilities](#other-built-ins-and-utilities)
    - [Components](#components-1)
    - [usePopover](#usepopover)
    - [Hyperscript](#hyperscript)
    - [String and time helpers](#string-and-time-helpers)
  - [Sharing state](#sharing-state)
    - [1. Props](#1-props)
    - [2. Context](#2-context)
    - [3. Module-scope state](#3-module-scope-state)
  - [Lifecycle](#lifecycle)
  - [Application patterns](#application-patterns)
    - [Getter props for reactive boundaries](#getter-props-for-reactive-boundaries)
    - [Routing](#routing)
    - [Organizing styles](#organizing-styles)
    - [For vs map](#for-vs-map)
    - [Data layer](#data-layer)
    - [Putting it together](#putting-it-together)
  - [Debugging](#debugging)
  - [Development](#development)

## Core concepts

A few ideas underpin everything else:

- **Components are web components.** Each component instance is a `<c-mp>` custom element in the DOM. You can inspect it directly in browser dev tools.
- **A component's setup runs once.** The function you pass to `defineComponent` runs a single time, when the element connects. After that, all updates happen through state, effects, and the reactive components below.
- **State is a proxy.** `useState` wraps a plain object so that reading a property registers a dependency and writing one triggers the effects that depend on it.
- **Effects track their own dependencies.** When an effect runs, every state property it reads is recorded. When any of those properties later changes, the effect re-runs. Re-runs are batched on a microtask, so several synchronous mutations cause a single update.
- **Everything has a debug name.** Components, state, effects, and mutations all take a name. These names appear in console logs and error messages, which is how you debug a running app.

## Tradeoffs

Read this before adopting c-mp.

- **Web Components have a cost.** Every component is a real `<c-mp>` element in the DOM, kept out of layout by `display: contents`. This aids debugging but adds per-component element overhead, and the whole approach depends on that one CSS rule being present. The wrapper also stays in the DOM tree even though it is invisible to layout, so CSS selectors that cross a component boundary break: a `<c-mp>` sits between a component's output and its parent, so direct-child (`>`), sibling (`+`, `~`), and positional selectors (`:first-child`, `:nth-child`) no longer match as written.
- **Verbose interpolation in JSX.** Displaying a reactive value requires `<Slot get={() => x} />` instead of `{x}` — so the most common operation in markup is both more verbose and prone to silent failure if you forget the `Slot`.
- **Getter props instead of reactive props.** Because setup runs once and props never change, anything reactive must be passed as a getter (`getPerson={() => state.person}`). This convention is not enforced by the type system — pass a plain value by mistake and it simply won't update.
- **Control flow uses components, not plain JSX.** Familiar inline patterns do not react to change: `{cond && <X />}` and `{ternary ? <A /> : <B />}` are evaluated once at setup and never update, and `{list.map(...)}` renders a static list. Reactive conditionals need `<Show it={$when(...)} />` and reactive lists need `<For each={...} />`. Inline JSX expressions still work for one-time content, but using them where you expect updates is a silent staleness trap.
- **Components do not re-render.** A component's setup function runs exactly once; there is no re-render cycle. Updates come entirely from the proxy state and effects, not from re-invoking the component. There is no `setState`-triggered re-run, no rules-of-hooks, no dependency arrays, and no need for `useCallback`/memoized identity. This is the largest mental-model shift coming from React, and most of the surprises above follow from it.
- **Manual mutation labeling.** State writes are wrapped in `mutateState(parent, name, fn)` by convention. This helps with debugging but is cumbersome to write. Forgetting it costs nothing but a console warning — the app still works — so the convention rests on discipline rather than enforcement.
- **No SSR or hydration.** c-mp is client-only by design. For SEO-sensitive pages, content sites, or fast first-paint requirements, this is disqualifying.
- **Minimal ecosystem and maturity.** There is no published package, no router, no component ecosystem, and no automated test suite (the example pages are exercised manually). You hand-roll routing and own any edge cases you hit in proxy tracking, effect scheduling, or list reconciliation.

Some things cut the other way:

- **You own the whole stack.** The library is roughly fifty small, readable files. There is no build magic beyond JSX, no dependency surface, and you can read or modify the framework itself when you hit a limitation.
- **Batteries included for data.** `useQuery` and `useInfiniteQuery` provide caching and staleness out of the box, where many frameworks leave data fetching to a separate library.

**When c-mp is a reasonable choice:** small-to-medium, client-only apps where you value owning and fully understanding your stack, and you (or a small team) can absorb the verbosity and the silent-failure footguns.

## Getting started

c-mp is distributed by copying, not by installing from a registry. Copy `src/c-mp` into your project — now you own it and can modify it as needed.

### package.json

Name your project and point the JSX runtimes at your copy of c-mp.

```json
{
  "name": "my-project",
  "exports": {
    "./jsx-dev-runtime": "./src/c-mp/jsx-dev-runtime.js",
    "./jsx-runtime": "./src/c-mp/jsx-runtime.js"
  }
}
```

### tsconfig.json

Use your project's name as the JSX import source.

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "my-project"
  }
}
```

### Entry point

Import the one-line stylesheet and mount your root component. The stylesheet contains a single rule, `[c-mp] { display: contents; }`, which keeps the wrapper custom elements out of the layout.

```tsx
import './c-mp/css/style.css'
import { MyAppComp } from './somewhere'

document.body.append(<MyAppComp />)
```

## Components

Define a component with `defineComponent`, passing a debug name and a setup function:

```tsx
import { defineComponent } from './c-mp/fun/defineComponent'

export const MyAppComp = defineComponent<{}>('MyAppComp', (props, $) => {
  return <div>Hello World!</div>
})
```

- The setup function runs **once**, when the component connects to the DOM.
- `props` are passed in by the parent and **never change** after setup. To pass values that change over time, pass a getter function instead (see [Sharing state](#sharing-state)).
- `$` is the component itself — the `<c-mp>` custom element. In everyday code you mostly use `$.debugName` (the name you gave the component) to label mutations. It also exposes lower-level hooks — context (`$.setContext`/`$.getContext`) and error handling (`$.onError`) — covered later.

The generic parameter types the props:

```tsx
export const GreetingComp = defineComponent<{ name: string }>(
  'GreetingComp',
  (props, $) => <div>Hello {props.name}!</div>,
)
```

## State and mutations

`useState` creates a reactive proxy from a plain object (or array). Reading a property inside an effect tracks it; writing a property triggers the dependent effects.

By convention, writes are wrapped in `mutateState(parent, name, fn)`, which labels the change for debugging. The signature takes three arguments: the parent name (use `$.debugName` inside a component), a short description of the mutation, and the function that performs the writes. Wrapping is not required for correctness — an unwrapped write still applies and still triggers its effects — but an unwrapped write logs `👾 Unlabeled mutation!` to the console so you can spot it.

```tsx
import { defineComponent } from './c-mp/fun/defineComponent'
import { mutateState, useState } from './c-mp/fun/useState'
import { Slot } from './c-mp/comp/Slot'

export const NameComp = defineComponent<{}>('NameComp', (props, $) => {
  // Declare state with a name and a default value:
  const inputState = useState('inputState', {
    value: 'World',
  })

  // A ref, populated once the element is created:
  let input: HTMLInputElement

  return (
    <>
      <input
        ref={(it) => {
          input = it
        }}
        value={() => inputState.value}
        oninput={() => {
          mutateState($.debugName, 'update name', () => {
            inputState.value = input.value
          })
        }}
      />
      <div>
        Hello <Slot get={() => inputState.value} />!
      </div>
    </>
  )
})
```

Notes:

- `value={() => inputState.value}` is a reactive attribute: c-mp sets up an effect that updates `input.value` whenever `inputState.value` changes (see [Element attributes](#element-attributes)).
- Wrapping writes in `mutateState` is a debugging convention, not a hard requirement: a write outside `mutateState` still applies and still triggers its effects — it only logs `👾 Unlabeled mutation!` to the console.
- Nested objects and arrays are proxied automatically. Primitives and class instances pass through unchanged.

## Effects

`useEffect(name, fn)` runs `fn` immediately, tracks every state property it reads, and re-runs it whenever any of those change. If `fn` returns a function, that cleanup runs before the next re-run and when the component disconnects.

```tsx
import { useEffect } from './c-mp/fun/useEffect'

useEffect('sync title', () => {
  document.title = `Hello ${inputState.value}`
})

useEffect('subscribe', () => {
  const id = setInterval(tick, 1000)
  return () => clearInterval(id) // cleanup
})
```

`useEffect` returns a `kill()` function to stop the effect manually. Effects are otherwise killed automatically when the component disconnects.

Related helpers:

- `untrack(name, fn)` — run `fn` without recording the state it reads, so those reads do not become dependencies of the current effect.
- `unchain(name, fn)` — like `untrack`, but also resets the effect recursion chain.
- `useMemo(name, getValue)` — returns a getter that recomputes only when its tracked dependencies change. Call the returned function to read the value (see [Application patterns](#application-patterns)).

## Displaying values: Slot

To display a reactive value in the DOM, use the `Slot` component with a `get` function. `Slot` re-renders whenever the value its `get` reads changes.

```tsx
import { Slot } from './c-mp/comp/Slot'

<Slot get={() => inputState.value} />
```

There is **no** `{() => value}` shorthand — putting a bare function inside JSX appends the function itself, not its result. Always use `<Slot get={...} />` for reactive text or elements.

`get` may return a string, a JSX element, or an array of elements. To render an HTML string without escaping it, pass `isTrustedHtml` and use the `html` template tag (which escapes interpolated values):

```tsx
import { html } from './c-mp/fun/html'

<Slot isTrustedHtml get={() => html`<b>Bold</b> and ${userInput}`.toString()} />
```

### Building a fragment of UI inside one Slot

When a piece of UI is assembled from several values that always change *together* — and the result is mostly formatted, presentational markup — it can be cleaner to build the whole fragment in one place and render it through a single `Slot`, rather than splitting it across many small nested slots. The `get` recomputes the entire block whenever any of its inputs change.

A common case is a formatted name or label: a helper returns a JSX fragment built from many fields of the same object, and one `Slot` renders it.

```tsx
function formatPersonName(person: IPerson) {
  return (
    <>
      {person.honorific ? <small>{person.honorific}</small> : ''}{' '}
      <span class='last-name'>{person.lastName ?? ''}</span>{' '}
      <b>{person.firstName ?? ''}</b>{' '}
      {person.nickname ? <small>({person.nickname})</small> : ''}{' '}
      {person.isDead ? '†' : ''}
    </>
  )
}

// Re-renders the whole formatted name whenever the person changes:
<Slot get={() => formatPersonName(getPerson())} />
```

Because `get` may return a JSX element (or array of elements), the fragment can include nested elements and classes without `isTrustedHtml`. If the source is instead a pre-formatted HTML string, use `isTrustedHtml` with the `html` template tag as shown above.

This trades fine-grained updates for simpler markup, so it suits read-only, display-oriented chunks (formatted names, dates, summaries) where the values are coupled. For interactive elements, or pieces that update independently, prefer separate slots, attributes, or child components.

## Conditional rendering: Show

`Show` picks a branch based on conditions. Build each condition with `$when(when, then)`, where `when` is a predicate and `then` is a component to render when the predicate is truthy. The `then` component receives a `get` prop — a getter returning the (truthy) condition value.

A single condition with a fallback:

```tsx
import { $when, Show } from './c-mp/comp/Show'

<Show
  it={$when(
    () => state.flag,
    ({ get }) => <div>It is on ({get()})</div>,
  )}
  else={() => <div>It is off</div>}
/>
```

Multiple conditions are evaluated in order; the first truthy one wins, and `else` renders if none match:

```tsx
<Show
  it={[
    $when(() => query.status === 'Loading ⌚', LoadingComp),
    $when(() => query.error, ErrorComp),
    $when(() => query.data, DataComp),
  ]}
  else={EmptyComp}
/>
```

Each branch is rendered as its own component instance, so its effects are cleaned up when the branch changes.

## Lists: For

`For` renders one component per item and updates the list efficiently as items are added, removed, or reordered.

```tsx
import { For } from './c-mp/comp/For'
import { Slot } from './c-mp/comp/Slot'

<For
  debugName='items'
  each={() => state.items}
  getKey={(item) => item.id}
  render={({ get, getIndex, getLength }) => (
    <div>
      <Slot get={() => get().label} />
      <button
        disabled={() => getIndex() === 0}
        onclick={() => {
          mutateState($.debugName, 'remove item', () => {
            state.items.splice(getIndex(), 1)
          })
        }}
      >
        ×
      </button>
    </div>
  )}
  empty={() => <div>No items.</div>}
/>
```

- `each` returns the array to render.
- `getKey` (optional) returns a stable key per item. With keys, c-mp reuses the matching item component when the array reorders, preserving that item's local state. Without `getKey`, the array index is the key.
- `render` receives `{ get, getIndex, getLength }`. `get()` returns the current item; the accessors are functions so they stay reactive.
- `empty` (optional) renders when the array is empty.

For static lists that never change, a plain `array.map(...)` directly in JSX is simpler. Reach for `For` when the list changes at runtime and you want efficient, state-preserving updates. See [Application patterns](#application-patterns).

## Element attributes

Most attributes accept either a static value or a getter function. A getter becomes a reactive effect that updates the property when its dependencies change.

```tsx
// Static class:
<div class='card primary'>…</div>

// Class as an array (falsy entries are dropped):
<div class={['card', isPrimary && 'primary']}>…</div>

// Reactive class (recomputes when state changes):
<div class={() => ['card', state.active && 'active']}>…</div>

// Reactive style (objects, including CSS custom properties):
<div style={() => ({ color: state.warn ? 'crimson' : 'black', '--w': `${pct}%` })}>…</div>

// Reactive property:
<input value={() => state.text} disabled={() => state.busy} />

// Event handlers:
<button onclick={() => doThing()}>Go</button>

// Ref — called with the created element:
<input ref={(it) => { input = it }} />
```

Notes:

- `class` accepts a string, an array (falsy entries removed, the rest joined), or a getter returning either.
- `style` accepts an object (including `--custom` properties) or a getter returning one.
- Any non-event property given a function becomes a reactive effect — except on nested custom elements (tags containing `-`), where functions are passed through so you can hand functions to other components.
- `ref` is called once with the finished element.

## Data fetching

### useQuery

`useQuery(name, () => options)` loads async data and exposes a reactive state object. The options factory is itself tracked, so when the values it reads change (for example, an id from the URL), the query updates.

```tsx
import { useQuery } from './c-mp/fun/useQuery'
import { minutes } from './c-mp/fun/minutes'

const images = useQuery('images', () => ({
  key: 'images',
  params: { personId: getPersonId() },
  load: async ({ personId }) => {
    if (!personId) return []
    const res = await fetch(`/api/persons/${personId}/images`)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json()
  },
  isEnabled: !!getPersonId(),
  staleAfter: minutes(30),
}))
```

Options:

| Option              | Description                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `key`               | Cache key. Together with the serialized `params`, identifies a cache entry shared across all components using it.                      |
| `params`            | Passed to `load`. Reading reactive values here makes the query depend on them.                                                         |
| `load`              | `async (params) => data`. Throw to surface an error.                                                                                   |
| `isEnabled`         | When `false`, this instance does not trigger loading. Use it for dependent queries (`isEnabled: !!getPersonId()`). Defaults to `true`. |
| `staleAfter`        | Milliseconds until loaded data is considered stale (default 5s). Use `Infinity` for data that never goes stale.                        |
| `deleteAfter`       | Milliseconds until stale, unused data is dropped from the cache (default 5 min).                                                       |
| `noReloadOnVisible` | Skip reloading when the document becomes visible again.                                                                                |

The returned state object is `{ status, data, error, loadedAt }` and is reactive — read it in `Slot`, `Show`, or effects. `status` is one of:

```
Never 🕳️ · Loading ⌚ · Loaded 📦 · Stale 🧟 · Error ⚠️ · Deleted 🗑️
```

Because the cache is keyed by `key` + `params`, multiple components requesting the same data share one network request and one cache entry.

Cache utilities (for advanced control):

- `reloadQueries(key?, paramsPredicate?)` — force-reload matching queries.
- `resetQueries(key?, paramsPredicate?)` — mark matching queries stale (and reload if enabled/visible).
- `useReloadOnVisible()` — call once at the root to reload stale queries when the user returns to the tab.

### useInfiniteQuery

`useInfiniteQuery(name, () => options)` accumulates pages. Your `load` receives a `page` field merged into `params`, and your response must include `hasMore`. It returns `[state, { loadNextPage, hasNextPage }]`.

```tsx
import { useInfiniteQuery } from './c-mp/fun/useInfiniteQuery'
import { For } from './c-mp/comp/For'

const [posts, {loadNextPage, hasNextPage}] = useInfiniteQuery('posts', () => ({
  key: 'posts',
  params: { tag: state.tag },
  load: async ({ page, tag }) => {
    const res = await fetch(`/api/posts?tag=${tag}&page=${page}`)
    const items = await res.json()
    return { items, hasMore: items.length > 0 }
  },
}))

return (
  <>
    <For
      debugName='posts'
      each={() => posts.data?.pages}
      render={({ get }) => <Slot get={() => get().value.items.length + ' items'} />}
    />
    <button onclick={loadNextPage} disabled={() => !hasNextPage()}>
      Load more
    </button>
  </>
)
```

`content.data` has the shape `{ pages: [{ id, value }] }`, where each `value` is one page's loaded data.

## Error boundaries

`ErrorBoundary` catches errors thrown during setup and effects in its subtree, and renders a fallback instead.

```tsx
import { ErrorBoundary } from './c-mp/comp/ErrorBoundary'

<ErrorBoundary
  try={() => <RiskyComp />}
  catch={({ error, stack, reset }) => (
    <div>
      <h1>Something went wrong</h1>
      <pre>
        <Slot get={() => error} />
      </pre>
      <button onclick={reset}>Try again</button>
    </div>
  )}
/>
```

- `try` renders the normal content.
- `catch` receives `{ error, stack, reset }`. Call `reset()` to clear the error and re-render `try`.
- An unhandled error bubbles up to the nearest ancestor `ErrorBoundary`. c-mp library frames are stripped from the stack for readability.

## Other built-ins and utilities

### Components

| Item       | Description                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `Icon`     | `<Icon svg={ICON_HOME} />` — renders an SVG string by setting `innerHTML`. Icons are typically defined as exported SVG-string constants. |
| `Fragment` | `<>…</>` — groups children without a wrapper element.                                                                                    |

### usePopover

Wraps the native HTML popover API and keeps a button and menu element positioned together.

```tsx
import { usePopover } from './c-mp/fun/usePopover'

const menu = usePopover({
  getMenuElem: () => state.menuRef,
  getButtonElem: () => state.buttonRef,
})
// menu.getIsOpen() · menu.open() · menu.close() · menu.toggle()
```

### Hyperscript

JSX compiles to `h(name, attrs)`. You can also call it directly, which is occasionally useful for programmatic construction:

```tsx
import { h } from './c-mp/fun/h'

const el = h('div', { class: 'card', children: [h('span', { children: 'Hi' })] })
```

Convenience wrappers exist for the built-in components: `$Fragment`, `$For`, `$Slot`, `$Show`, `$ErrorBoundary`, `$Icon` (from `c-mp/fun/hyperscriptHelpers`).

### String and time helpers

| Helper                                   | Description                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `html\`…\`` / `svg\`…\``                 | Template tags that escape interpolated values; return an escaped string.                                |
| `url\`…\``                               | Template tag that URI-encodes interpolated values.                                                      |
| `json\`…\``                              | Template tag that JSON-stringifies interpolated values.                                                 |
| `escapeHtml(value)`                      | Escape HTML special characters.                                                                         |
| `seconds(n)` / `minutes(n)` / `hours(n)` | Convert to milliseconds (handy for `staleAfter`/`deleteAfter`).                                         |
| `sleep(ms)` / `sleepFrames(n)`           | Promise-based delays (by time or animation frames).                                                     |
| `jsonClone(value)`                       | Deep clone via JSON.                                                                                    |
| `mirror(field, source, target)`          | Copy properties from one proxy into another, matching array items by id. Used internally by `useQuery`. |

## Sharing state

State in c-mp is the same reactive proxy regardless of where it lives. Sharing it between components is a question of scope and coupling, not mechanism. There are three common approaches — pick the narrowest one that fits.

### 1. Props

The default. A parent passes state to specific children. Because props never change, pass a **getter** for anything that should stay reactive:

```tsx
// Pass a getter, not a snapshot value:
<PortraitComp getPerson={() => state.person} />

const PortraitComp = defineComponent<{ getPerson: () => IPerson }>(
  'PortraitComp',
  (props, $) => <Slot get={() => props.getPerson().name} />,
)
```

### 2. Context

For values that must reach deep descendants without threading props through every level. An ancestor calls `$.setContext(key, value)`; any descendant calls `$.getContext(key)`, which returns its own value if set, otherwise walks up the parent chain. Keys are symbols. Typically the value you store is a getter, so descendants read live data.

```tsx
const themeKey = Symbol('theme')

// Ancestor:
$.setContext(themeKey, () => state.theme)

// Descendant:
const getTheme = $.getContext(themeKey) as () => string
```

### 3. Module-scope state

For genuinely app-wide state — the signed-in user, the current route, a loaded dataset — call `useState` at module scope and export it. Everyone who imports it shares the same reactive object.

```tsx
// model/appState.ts
import { useState } from '../c-mp/fun/useState'

export const appState = useState('appState', {
  data: undefined as IData | undefined,
  page: Page.Home,
})
```

Mutate it from anywhere with `mutateState`, and optionally guard access with small helper functions. This is one valid approach — not a requirement; props or context are often the better, lower-coupling choice.

## Lifecycle

- **Setup** runs once when the component connects.
- **Cleanup** happens on disconnect: every effect's cleanup function runs, and anything registered in `$.kills` is called. Effects you create with `useEffect` are cleaned up automatically.
- **Errors** can be handled per-component by setting `$.onError`; `ErrorBoundary` uses this internally.

## Application patterns

These patterns come from a real, non-trivial app built on c-mp. They are conventions, not requirements, but they show how the pieces fit together at scale.

### Getter props for reactive boundaries

Since props never change, components that need a value to stay live accept a **getter** rather than a value:

```tsx
// Instead of: <PersonComp person={state.person} />   (snapshot, won't update)
<PersonComp getPerson={() => state.person} />          // stays reactive
```

### Routing

Client-side routing can be expressed with the native `URLPattern` API feeding shared state. A small helper installs the listeners and updates the route on navigation:

```tsx
const patterns = [
  { name: Page.Person, pattern: new URLPattern({ pathname: '/person/:id' }) },
  { name: Page.Home, pattern: new URLPattern({ pathname: '/' }) },
]

export function useRouting() {
  function onNavigate() {
    let match = null
    let page = Page.NotFound
    for (const p of patterns) {
      match = p.pattern.exec(location.href)
      if (match) { page = p.name; break }
    }
    mutateState('useRouting', 'navigate', () => {
      appState.page = page
      appState.pathMatch = match
    })
  }
  addEventListener('popstate', onNavigate)
  // …intercept same-origin link clicks, call history.pushState, then onNavigate()
  onNavigate()
}
```

Components then branch on the route with `Show`. The example app stores the route in module-scope state, but context or a top-level component's own state would work equally well.

### Organizing styles

One option is a `const enum` mapping type-safe keys to class-name strings (composing utility classes), used with reactive `class` getters:

```tsx
export const enum _ {
  ccc_button = 'ccc_button',
  ccc_button__rounded = 'ccc_button ccc__rounded',
  ccc__selected = 'ccc__selected',
}

<button class={() => [_.ccc_button, menu.getIsOpen() && _.ccc__selected]}>Menu</button>
```

### For vs map

Use `For` for dynamic, keyed lists that change at runtime — it preserves each item's component and local state across reorders. Use a plain `array.map(...)` for static lists (e.g. a fixed set of buttons), which is simpler and has no keying overhead.

### Data layer

Keep one small `async` fetch helper per endpoint and pass it directly as a query's `load`. Throw on real failures; return an empty/neutral value for expected cases like a 404. Errors surface as `query.error` and bubble to the nearest `ErrorBoundary`.

```tsx
export async function fetchPersonImages(personId: string) {
  const res = await fetch(`/api/persons/${personId}/images`)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<string[]>
}
```

### Putting it together

A root component typically wires routing, an error boundary, and a route table:

```tsx
export const AppComp = defineComponent<{}>('AppComp', (props, $) => {
  useRouting()

  return (
    <ErrorBoundary
      try={() => (
        <Show
          it={[
            $when(() => appState.page === Page.Home, PageHomeComp),
            $when(() => appState.page === Page.Person, PagePersonComp),
          ]}
          else={PageNotFoundComp}
        />
      )}
      catch={({ error, reset }) => (
        <div>
          <Slot get={() => error} />
          <button onclick={reset}>Retry</button>
        </div>
      )}
    />
  )
})
```

## Debugging

- **Log levels:** `cmp.setLogLevel(n)` (0–3) controls verbosity; higher levels log state reads, mutations, and effect runs. The level persists in `sessionStorage`. The `cmp` object is a global access point exported from `c-mp/model/cmp`.
- **Log markers:** look for ✏️ (state set), 🗑️ (state delete), 👾 (mutation), and 💫 (Show condition change) in the console. Each line includes the debug name you provided.
- **Unlabeled mutations:** writing state outside `mutateState` logs `👾 Unlabeled mutation!` — a sign you forgot to wrap a write.
- **Stack traces:** c-mp strips its own frames from error stacks by default for readability. Call `cmp.setStripStackDisabled(true)` to see the full trace.

## Development

This repository is the c-mp source plus a browser-based example harness.

- `npm run dev` — start the Vite dev server and open the example/test components in `src/comp`.
- `npm run build` — type-check with `tsc` and build with Vite.

There is no automated test runner; the components under `src/comp` are example/test pages exercised manually in the browser. They are also the best reference for idiomatic usage of each feature.
