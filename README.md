# Simple-Rxjs-Store
Simple store to hold application state.

* <a href="https://rxjs-dev.firebaseapp.com/">Rxjs</a> to observe changes. 
* <a href="https://github.com/immerjs/immer">Immer</a> to crete immutable state updates. 
* <a href="https://github.com/lukeed/dequal">Dequal</a> for only updateing selects when what you selected actually changes.

# Example Usage

```typescript
import { Store } from 'simple-rxjs-store'

interface MyState {
  list: Array<number>,
  foo: string,
  bar: { cat: string }
}

const myStore = new Store({ list: [], foo: 'foo', bar: { cat: 'mine' } } )

myStore.select('list').subscribe(/*do something with your array of numbers*/)
myStore.select(state => state.bar.cat).subscribe(/*do something with your cat*/)
myStore.update(state => {
  state.bar.cat = 'yours'
})
```
