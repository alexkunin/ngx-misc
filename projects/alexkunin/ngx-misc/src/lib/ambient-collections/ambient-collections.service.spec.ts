import { InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { from, interval, zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { AmbientCollectionsService } from './ambient-collections.service';

interface TypeA {
  a: string;
}

interface TypeB {
  b: number;
}

const A = new InjectionToken<TypeA>('A');
const B = new InjectionToken<TypeB>('B');

const a1 = { a: 'a1' };
const a2 = { a: 'a2' };
const b1 = { b: 1 };

describe('AmbientRegistryService', () => {
  let service: AmbientCollectionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmbientCollectionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  test('initially empty', () => {
    expect(service.getAll(A)).toHaveLength(0);
    expect(service.getAll(B)).toHaveLength(0);
  });

  describe('publish()/unpublish()', () => {
    test('valid operations', () => {
      service.publish(A, a1);
      expect(service.getAll(A)).toEqual([ a1 ]);

      service.publish(A, a2);
      expect(service.getAll(A)).toEqual([ a1, a2 ]);

      service.unpublish(a1);
      expect(service.getAll(A)).toEqual([ a2 ]);

      service.publish(A, a1);
      expect(service.getAll(A)).toEqual([ a2, a1 ]);

      service.unpublish(a1);
      service.unpublish(a2);
      expect(service.getAll(A)).toEqual([]);
    });

    test('double publish', () => {
      service.publish(A, a1);
      expect(() => service.publish(A, a1)).toThrow(/published/);
    });

    test('double unpublish', () => {
      service.publish(A, a1);
      service.unpublish(a1);
      expect(() => service.unpublish(a1)).toThrow(/not published/);
    });

    test('unpublish unknown', () => {
      expect(() => service.unpublish(a1)).toThrow(/not published/);
    });
  });

  test('getEventStream()', () => {
    new TestScheduler((actual, expected) => expect(actual).toEqual(expected)).run(helpers => {
      // As events contain references to internal collections that change over time,
      // we need to store deep copies to allow expectations to succeed.
      const deepCopies = service.getEventStream().pipe(
        map(v => JSON.stringify(v)),
        map(v => JSON.parse(v)),
      );
      helpers.expectObservable(deepCopies).toBe(
        '-abcdef|',
        {
          a: { type: 'publish', token: A, item: a1, index: 0, collection: [ a1 ] },
          b: { type: 'publish', token: B, item: b1, index: 0, collection: [ b1 ] },
          c: { type: 'unpublish', token: B, item: b1, index: 0, collection: [] },
          d: { type: 'publish', token: A, item: a2, index: 1, collection: [ a1, a2 ] },
          e: { type: 'unpublish', token: A, item: a1, index: 0, collection: [ a2 ] },
          f: { type: 'unpublish', token: A, item: a2, index: 0, collection: [] },
        },
      );

      zip(
        from([
          () => service.publish(A, a1),
          () => service.publish(B, b1),
          () => service.unpublish(b1),
          () => service.publish(A, a2),
          () => service.unpublish(a1),
          () => service.unpublish(a2),
          () => service.ngOnDestroy(),
        ]),
        interval(1),
      ).subscribe(([ f ]) => f());
    });
  });

  test('observeCollection()', () => {
    new TestScheduler((actual, expected) => expect(actual).toEqual(expected)).run(helpers => {
      helpers.expectObservable(service.observeCollection(A)).toBe(
        'ab--cde|',
        {
          a: [],
          b: [ a1 ],
          c: [ a1, a2 ],
          d: [ a2 ],
          e: [],
        },
      );

      zip(
        from([
          () => service.publish(A, a1),
          () => service.publish(B, b1),
          () => service.unpublish(b1),
          () => service.publish(A, a2),
          () => service.unpublish(a1),
          () => service.unpublish(a2),
          () => service.ngOnDestroy(),
        ]),
        interval(1),
      ).subscribe(([ f ]) => f());
    });
  });
});
