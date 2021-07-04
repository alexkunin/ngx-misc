import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface AmbientCollectionsPublishEvent<T = any> {
  type: 'publish';
  token: InjectionToken<T>;
  item: T;
  index: number;
  collection: T[];
}

export interface AmbientCollectionsUnpublishEvent<T = any> {
  type: 'unpublish';
  token: InjectionToken<T>;
  item: T;
  index: number;
  collection: T[];
}

export type AmbientCollectionsEvent
  = AmbientCollectionsPublishEvent
  | AmbientCollectionsUnpublishEvent;

export interface AmbientCollectionsServiceInterface {
  publish<T>(token: InjectionToken<T>, item: T): void;
  unpublish<T>(item: T): void;
  republish<T>(existingItem: T, newItem: T): void;
  observeCollection<T>(token: InjectionToken<T>): Observable<T[]>;
}

export interface AmbientCollectionSlice<T> {
  set(newValue: T[]): void;
  reset(): void;
  release(): void;
}
