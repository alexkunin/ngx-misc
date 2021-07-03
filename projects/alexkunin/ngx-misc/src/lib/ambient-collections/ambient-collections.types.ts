import { InjectionToken } from '@angular/core';

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
