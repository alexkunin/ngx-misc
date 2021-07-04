import { TestBed } from '@angular/core/testing';
import { from, interval, Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { AmbientCollection } from './ambient-collection';
import { AmbientCollectionSlice } from './ambient-collections.types';

describe('AmbientCollection', () => {
  type A = string;
  let collection: AmbientCollection<A>;
  let changes$: Observable<A[]>;

  beforeEach(() => {
    const { collection: COLLECTION_TOKEN, changes: CHANGES_TOKEN } = AmbientCollection.define<A>('A');
    collection = TestBed.inject(COLLECTION_TOKEN);
    changes$ = TestBed.inject(CHANGES_TOKEN);
  });

  test('general functionality', () => {
    new TestScheduler((actual, expected) => expect(actual).toEqual(expected)).run(helpers => {
      let s1: AmbientCollectionSlice<A>;
      let s2: AmbientCollectionSlice<A>;
      let s3: AmbientCollectionSlice<A>;

      const deepCopy$ = changes$.pipe(
        map(v => JSON.stringify(v)),
        map(v => JSON.parse(v)),
      );

      helpers.expectObservable(deepCopy$).toBe(
        // XXX: double events are because of lazy implementation of republish; worth optimizing
        'a----b----c----(de)-(fg)-(hh)-i----j----(kl)-(mn)-o----p',
        {
          a: [],
          b: [ 'A' ],
          c: [ 'A', 'Z' ],
          d: [ 'Z' ],
          e: [ 'B', 'Z' ],
          f: [ 'B' ],
          g: [ 'B', 'Y', 'X' ],
          h: [ 'Y', 'X' ],
          i: [ 'Y', 'X' ],
          j: [],
          k: [],
          l: [ '$' ],
          m: [ '$' ],
          n: [ 'C', '$' ],
          o: [ '$' ],
          p: [],
        },
      );

      zip(
        from([
          () => s1 = collection.allocateSlice([ 'A' ]),
          () => s2 = collection.allocateSlice([ 'Z' ]),
          () => s1.set([ 'B' ]),
          () => s2.set([ 'Y', 'X' ]),
          () => s1.reset(),
          () => s3 = collection.allocateSlice(),
          () => s2.release(),
          () => s3.set([ '$' ]),
          () => s1.set([ 'C' ]),
          () => s1.release(),
          () => s3.release(),
        ]),
        interval(5),
      ).subscribe(([ f ]) => f());
    });
  });
});
