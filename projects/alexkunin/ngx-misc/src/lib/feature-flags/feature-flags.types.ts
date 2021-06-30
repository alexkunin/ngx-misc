import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export class FeatureFlag<T extends string> {
  constructor(
    readonly id: T,
    readonly caption: string,
    readonly description: string,
    readonly defaultValue: boolean,
  ) {
  }
}

export type FeatureFlags<T extends string = any> = FeatureFlag<T>[];

type FeatureFlagIds<T extends FeatureFlags> = T extends FeatureFlags<infer U> ? U : never;

export type FeatureFlagManager<T extends FeatureFlags>
  = { [key in `is${ Capitalize<FeatureFlagIds<T>> }Enabled`]: () => boolean }
  & { [key in `${ FeatureFlagIds<T> }Enabled$`]: Observable<boolean> };

export const FEATURE_FLAGS = new InjectionToken<FeatureFlagManager<any>>('FEATURE_FLAGS');
