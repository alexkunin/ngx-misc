import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, map, share } from 'rxjs/operators';
import { FeatureFlagsStorageService } from './feature-flags-storage.service';
import { FeatureFlag, FeatureFlagManager, FeatureFlags } from './feature-flags.types';

@Injectable()
export class FeatureFlagsService {
  private featureFlags: FeatureFlags = [];
  private idToFlag: { [id: string]: FeatureFlag<string> } = {};
  private readonly eventStreamSubject = new ReplaySubject<{ [id: string]: boolean }>(1);

  constructor(
    private readonly storage: FeatureFlagsStorageService,
  ) {
  }

  public setFeatureFlags(featureFlags: FeatureFlags): void {
    this.featureFlags = featureFlags;
    this.idToFlag = Object.fromEntries(this.featureFlags.map(f => [ f.id, f ])) as any;
    this.eventStreamSubject.next(this.getCurrentState());
  }

  private getCurrentState(): Record<string, boolean> {
    const result = {} as Record<string, boolean>;
    for (const { id } of this.featureFlags) {
      result[id] = this.isEnabled(id);
    }
    return result;
  }

  isEnabled(id: string): boolean {
    const storedValue = (this.storage.retrieve() as any)?.[id];
    return typeof storedValue === 'boolean' ? storedValue : this.idToFlag[id].defaultValue;
  }

  getDefinedFeatures(): FeatureFlags {
    return this.featureFlags;
  }

  setFeatureState(id: string, state: boolean): void {
    this.storage.store({ ...this.storage.retrieve(), [id]: state });
    this.eventStreamSubject.next(this.getCurrentState());
  }

  getEventStream(): Observable<Record<string, boolean>>;
  getEventStream(id: string): Observable<boolean>;
  getEventStream(id?: string): Observable<Record<string, boolean> | boolean> {
    if (typeof id === 'undefined') {
      return this.eventStreamSubject.asObservable();
    } else {
      return this.eventStreamSubject.pipe(
        map(v => v[id]),
        distinctUntilChanged(),
      );
    }
  }

  hasAnyOverrides(): boolean {
    return this.getDefinedFeatures().some(f => this.isEnabled(f.id) !== f.defaultValue);
  }

  cleanUp(): void {
    this.eventStreamSubject.complete();
  }

  getManager<T extends FeatureFlags>(): FeatureFlagManager<T> {
    const result: any = {};
    for (const { id } of this.featureFlags) {
      result[`is${ String(id).replace(/^./, c => c.toUpperCase()) }Enabled`] = () => this.isEnabled(id);
      result[`${ String(id) }Enabled$`] = this.getEventStream(id).pipe(share());
    }
    return result;
  }
}
