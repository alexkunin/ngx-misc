import { Injectable, InjectionToken, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { AmbientCollectionsEvent } from './ambient-collections.types';

@Injectable({
  providedIn: 'root',
})
export class AmbientCollectionsService implements OnDestroy {
  private readonly tokenToCollection = new Map<InjectionToken<any>, any[]>();
  private readonly itemToCollectionAndToken = new Map<any, [ any[], InjectionToken<any> ]>();
  private readonly eventsSubject = new Subject<AmbientCollectionsEvent>();

  getAll<T>(token: InjectionToken<T>): T[] {
    return this.tokenToCollection.get(token) ?? [];
  }

  publish<T>(token: InjectionToken<T>, item: T): void {
    if (this.itemToCollectionAndToken.has(item)) {
      throw new Error('Item is already published');
    }
    let collection = this.tokenToCollection.get(token);
    if (collection) {
      collection.push(item);
    } else {
      collection = [ item ];
      this.tokenToCollection.set(token, collection);
    }
    this.itemToCollectionAndToken.set(item, [ collection, token ]);
    this.eventsSubject.next({
      type: 'publish',
      token,
      item,
      index: collection.length - 1,
      collection,
    });
  }

  unpublish<T>(item: T): void {
    const tmp = this.itemToCollectionAndToken.get(item);
    if (!tmp) {
      throw new Error('Item is not published');
    }
    const [ collection, token ] = tmp;
    const index = collection.indexOf(item);
    collection.splice(index, 1);
    this.itemToCollectionAndToken.delete(item);
    this.eventsSubject.next({
      type: 'unpublish',
      token: token,
      item,
      index,
      collection,
    });
  }

  getEventStream(): Observable<AmbientCollectionsEvent> {
    return this.eventsSubject.asObservable();
  }

  ngOnDestroy(): void {
    this.eventsSubject.complete();
  }

  observeCollection<T>(token: InjectionToken<T>): Observable<T[]> {
    return this.eventsSubject.pipe(
      filter(e => e.token === token),
      map(({ collection }) => collection),
      startWith(this.getAll(token)),
      map(collection => [ ...collection ]),
    );
  }
}
