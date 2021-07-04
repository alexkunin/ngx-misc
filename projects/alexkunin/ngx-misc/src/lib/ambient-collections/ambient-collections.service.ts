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
    return this.getOrCreateCollection(token);
  }

  publish<T>(token: InjectionToken<T>, item: T): void {
    if (this.itemToCollectionAndToken.has(item)) {
      throw new Error('Item is already published');
    }
    const collection = this.getOrCreateCollection(token);
    collection.push(item);
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

  republish<T>(existingItem: T, newItem: T): void {
    const tmp = this.itemToCollectionAndToken.get(existingItem);
    if (!tmp) {
      throw new Error('Item is not published');
    }
    const [ collection, token ] = tmp;
    if (this.itemToCollectionAndToken.has(newItem)) {
      throw new Error('Item is already published');
    }
    const index = collection.indexOf(existingItem);
    collection.splice(index, 1);
    this.itemToCollectionAndToken.delete(existingItem);
    this.eventsSubject.next({
      type: 'unpublish',
      token: token,
      item: existingItem,
      index,
      collection,
    });
    collection.splice(index, 0, newItem);
    this.itemToCollectionAndToken.set(newItem, [ collection, token ]);
    this.eventsSubject.next({
      type: 'publish',
      token: token,
      item: newItem,
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

  private getOrCreateCollection<T>(token: InjectionToken<T>): T[] {
    let collection = this.tokenToCollection.get(token);
    if (!collection) {
      collection = [];
      this.tokenToCollection.set(token, collection);
    }
    return collection;
  }
}
