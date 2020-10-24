import { Expect, Test, TestCase, TestFixture } from 'alsatian'
import { Store } from '../src'
import { firstValueFrom, lastValueFrom, Observable, of, zip } from 'rxjs'
import { map, single, take } from 'rxjs/operators'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

@TestFixture('Store tests')
export class StoreTests {
  @Test('create empty store')
  @TestCase({})
  @TestCase(of({}))
  public createEmptyStore (initialState: Record<string, unknown> | Observable<Record<string, unknown>>): void {
    Expect(new Store(initialState)).toBeDefined()
  }

  @Test('basic select')
  @TestCase({ value: true })
  @TestCase(of({ value: true }))
  public testBasicSelect (initialState: { value: boolean } | Observable<{ value: boolean }>): Promise<void> {
    const store = new Store(initialState)
    return firstValueFrom(store.select('value').pipe(map(result => {
      Expect(result).toBeTruthy()
    })))
  }

  @Test('test multiple selects')
  @TestCase({})
  @TestCase(of({}))
  public multipleSelects (initialState: Record<string, unknown> | Observable<Record<string, unknown>>): Promise<void> {
    const store = new Store(initialState)
    const obs1 = store.select('value')
    const obs2 = store.select('value')
    return firstValueFrom(
      zip([obs1, obs2])
        .pipe(
          map(([val1, val2]) => {
            Expect(val1).toBe(val2)
          })
        )
    )
  }

  @Test('test update')
  @TestCase({ value: 1 })
  @TestCase(of({ value: 1 }))
  public singleUpdate (initialState: { value: number } | Observable<{ value: number }>): Promise<void> {
    const store = new Store(initialState)
    setTimeout(() => {
      store.update(store => {
        store.value = 2
      })
    }, 1)
    return lastValueFrom(
      store.select('value').pipe(
        take(2),
        map((value: number, index: number) => {
          Expect(value).toBe(index + 1)
        })
      )
    )
  }

  @Test('test multiple updates')
  @TestCase({ value: 1 })
  @TestCase(of({ value: 1 }))
  public multipleUpdate (initialState: { value: number } | Observable<{ value: number }>): Promise<void> {
    const store = new Store(initialState)
    setTimeout(() => {
      store.update(store => {
        store.value = 2
      })
    }, 1)
    setTimeout(() => {
      store.update(store => {
        store.value = 3
      })
    }, 10)
    setTimeout(() => {
      store.update(store => {
        store.value = 4
      })
    }, 10)
    return lastValueFrom(
      store.select('value').pipe(
        take(4),
        map((value: number, index: number) => {
          Expect(value).toBe(index + 1)
        })
      )
    )
  }

  @Test('test no change on equal update')
  @TestCase({ value: 'one' })
  @TestCase(of({ value: 'one' }))
  public equalUpdate (initialState: { value: string } | Observable<{ value: string }>): Promise<void> {
    const store = new Store(initialState)
    setTimeout(() => {
      store.update(store => {
        store.value = 'one'
      })
    }, 1)
    return new Promise<void>((resolve, reject) => {
      store.select('value').pipe(map(noop), single())
        .subscribe({ error: reject })
      setTimeout(resolve, 10)
    })
  }

  @Test('test custom compare')
  @TestCase({ value: { test: 1 } })
  @TestCase(of({ value: { test: 1 } }))
  public customCompare (initialState: { value: { test: number } } | Observable<{ value: { test: number } }>): Promise<void> {
    const store = new Store(initialState)
    setTimeout(() => {
      store.update(store => {
        store.value = { test: 1 }
      })
    }, 1)
    setTimeout(() => {
      store.update(store => {
        store.value.test = 1
      })
    }, 10)
    setTimeout(() => {
      store.update(store => {
        store.value = { test: 1 }
      })
    }, 10)
    return lastValueFrom(
      store.select(
        'value',
        (a, b) => a.test !== b.test
      ).pipe(
        take(4),
        map(noop)
      )
    )
  }
}
