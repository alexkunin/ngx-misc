import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AmbientCollectionsService } from './ambient-collections.service';
import { AmbientCollectionSlice, AmbientCollectionsServiceInterface } from './ambient-collections.types';

export class AmbientCollection<T> {
  constructor(
    private readonly service: AmbientCollectionsServiceInterface,
    private readonly token: InjectionToken<T[]>,
  ) {
  }

  allocateSlice(value: T[] = []): AmbientCollectionSlice<T> {
    this.service.publish(this.token, value);

    return {
      set: (newValue: T[]): void => {
        this.service.republish(value, newValue);
        value = newValue;
      },

      reset: (): void => {
        const oldValue = value;
        value = [];
        this.service.republish(oldValue, value);
      },

      release: (): void => this.service.unpublish(value),
    };
  }

  static define<T>(description: string): {
    collection: InjectionToken<AmbientCollection<T>>,
    changes: InjectionToken<Observable<T[]>>,
  } {
    const token = new InjectionToken<T>(`${ description }$AMBIENT_COLLECTION_ITEM`);

    const collection = new InjectionToken<AmbientCollection<T>>(
      description + '$AMBIENT_COLLECTION',
      {
        factory: () => new AmbientCollection(inject(AmbientCollectionsService), token),
      },
    );

    const changes = new InjectionToken<Observable<T[]>>(
      description + '$AMBIENT_COLLECTION_CHANGES',
      {
        factory: () => inject(AmbientCollectionsService).observeCollection<T[]>(token).pipe(
          map(slices => slices.flat()),
        ),
      },
    );

    return { collection, changes };
  }
}
