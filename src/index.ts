import { isObservable, Observable, ReplaySubject } from 'rxjs'
import {
  distinctUntilChanged,
  map,
  pairwise,
  shareReplay,
  startWith,
  take
} from 'rxjs/operators'
import { dequal } from 'dequal'
import produce from 'immer'

export type StoreUpdate<T> = {
  previous: Readonly<T>;
  current: Readonly<T>;
  action?: string;
  error?: unknown
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

const initStore = 'init-store-'

export class Store<T> {
  private readonly _storeUpdateSubject = new ReplaySubject<StoreUpdate<T>>(1)
  private readonly _defaultEqual: (a: unknown, b: unknown) => boolean

  constructor (
    initialState: T | Observable<T>,
    defaultEqual: (a: unknown, b: unknown) => boolean = dequal) {
    this._defaultEqual = defaultEqual
    if (isObservable(initialState)) {
      initialState
        .pipe(
          startWith(undefined),
          pairwise(),
          map(([prev, cur], index) => {
            const current = produce(cur, noop) as T
            return {
              current: current,
              label: initStore + index,
              previous: prev ?? current
            }
          })
        )
        .subscribe({
          next: it => this._storeUpdateSubject.next(it),
          error: it => this._storeUpdateSubject.error(it)
        })
    } else {
      const current = produce(initialState, noop)
      this._storeUpdateSubject.next(
        { current, action: initStore, previous: current }
      )
    }
  }

  get changes (): Observable<Readonly<StoreUpdate<T>>> {
    return this._storeUpdateSubject.asObservable()
  }

  select<K extends keyof T> (
    key: K,
    compare?: (a: T[K], b: T[K]) => boolean
  ): Observable<T[K]>

  select<V> (
    selectFn: (state: T) => V,
    compare?: (a: V, b: V) => boolean
  ): Observable<V>

  select<V, K extends keyof T> (
    input: ((state: T) => V) | K,
    compare: (a: V, b: V) => boolean = this._defaultEqual
  ): Observable<V> {
    const mapper = typeof input === 'function'
      ? input
      : (state: T) => state[input] as unknown as V
    return this._storeUpdateSubject.pipe(
      map(state => mapper(state.current)),
      distinctUntilChanged(compare),
      shareReplay(1)
    )
  }

  update (command: (state: T) => void, action?: string): void {
    this._storeUpdateSubject.pipe(
      take(1),
      map((lastUpdate: StoreUpdate<T>) => {
        let current
        let error
        try {
          current = produce(lastUpdate.current, command)
        } catch (e) {
          current = lastUpdate.current
          error = e
        }
        this._storeUpdateSubject.next(
          { previous: lastUpdate.current, current, action, error }
        )
      })
    ).subscribe()
  }
}
