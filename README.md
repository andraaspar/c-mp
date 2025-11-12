# c-mp <small>is a web component library</small>

## Features

- **Simple, hackable, full of footguns!**
- **Granular updates**, using **proxy state**.
- **JSX, no VDOM**: `let element = <div>Yay!</div>`
- **useQuery** and **useInfiniteQuery** included.
- **No browser plugin needed**, as components are simply visible in browser dev tools, and debug names are required for 👾 mutations, ▶️ effects and ✏️ state.

## Start

Copy `src/c-mp` into your project. Now you own it. Feel free to modify as needed.

### package.json

Name your project and set up JSX support.

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

Use your project's name for JSX.

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "my-project"
  }
}
```

### index.ts

Do not forget to import the one-liner CSS!

```tsx
import './c-mp/css/style.css'
import { MyAppComp } from './somewhere'

document.body.append(<MyAppComp />)
```

## Components

```tsx
import { defineComponent } from './c-mp/fun/defineComponent'

export const MyAppComp = defineComponent<{}>('MyAppComp', (props, $) => {
  $.append(<div>Hello World!</div>)

  return $
})
```

The component function runs only once. To update the DOM later, you use state, effects & mutations.

`props` never change.

`$` is the web component itself, a `<c-mp>` element in the DOM.

`$.append(...)` is a DOM API for adding children.

`return $` is funny, and it keeps TSX happy.

## State, effect and mutation

This is how you use them:

```tsx
import { defineComponent } from '../c-mp/fun/defineComponent'
import { mutateState, useState } from '../c-mp/fun/useState'

export const MyAppComp = defineComponent<{}>('MyAppComp', (props, $) => {
  // Declare state with name and default value:
  const inputState = useState('inputState', {
    value: 'World',
  })

  // Declare ref, to be populated when the $.append() call finishes:
  let input: HTMLInputElement

  $.append(
    <>
      <input
        ref={(it) => {
          // Store the ref:
          input = it
        }}
        value={() => inputState.value}
        oninput={() => {
          // Name your mutation and update the state:
          mutateState('update name', () => {
            inputState.value = input.value
          })
        }}
      />
      <div>Hello {() => inputState.value}!</div>
    </>
  )

  // `input` is now defined. Any useEffect calls go here.

  return $
})
```

`value={() => inputState.value}` creates an effect to update `input.value` whenever `inputState.value` changes. The same could be achieved by doing:

```tsx
$.append(...)

useEffect(`input.value`, () => {
  input.value = inputState.value
})
```

`<div>Hello {() => inputState.value}!</div>` creates a `Slot` component to display the value. It will be expanded to:

```tsx
<div>Hello <Slot get={() => inputState.value} />!</div>
```

## Global state

You can use `useState` outside of components to declare global state, and then import and use it in multiple components.

## Further examples

See the tests in `src/comp`.