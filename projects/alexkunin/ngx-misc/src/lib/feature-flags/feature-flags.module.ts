import { CommonModule } from '@angular/common';
import { inject, ModuleWithProviders, NgModule } from '@angular/core';
import { FeatureFlagsStorageService, FeatureFlagsStorageServiceOptions } from './feature-flags-storage.service';
import { FeatureFlagsService } from './feature-flags.service';
import { FEATURE_FLAGS, FeatureFlags } from './feature-flags.types';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ],
})
export class FeatureFlagsModule {
  static forRoot<F extends string>(featureFlags: FeatureFlags): ModuleWithProviders<FeatureFlagsModule> {
    return {
      ngModule: FeatureFlagsModule,
      providers: [
        {
          provide: FeatureFlagsStorageServiceOptions,
          useValue: new FeatureFlagsStorageServiceOptions('feature-flags'),
        },
        {
          provide: FeatureFlagsService,
          useFactory: () => {
            const instance = new FeatureFlagsService(inject(FeatureFlagsStorageService));
            instance.setFeatureFlags(featureFlags);
            return instance;
          },
        },
        {
          provide: FEATURE_FLAGS,
          useFactory: () => inject(FeatureFlagsService).getManager(),
        },
      ],
    };
  }
}
