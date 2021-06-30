import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

export class FeatureFlagsStorageServiceOptions {
  constructor(readonly storageKey: string) {
  }
}

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagsStorageService {
  constructor(
    @Inject(DOCUMENT) private readonly documentRef: Document,
    private readonly options: FeatureFlagsStorageServiceOptions,
  ) {
  }

  private getLocalStorage(): Storage | null {
    return this.documentRef.defaultView?.localStorage ?? null;
  }

  store(data: { [key: string]: boolean }): void {
    const localStorage = this.getLocalStorage();
    if (localStorage) {
      try {
        localStorage[this.options.storageKey] = JSON.stringify(data);
      } catch (e) {
        console.error('FeatureFlagsStorageService.store failed: ', e);
      }
    } else {
      console.warn('FeatureFlagsStorageService.store failed: local storage is not accessible');
    }
  }

  retrieve(): { [key: string]: boolean } {
    const localStorage = this.getLocalStorage();
    let result = {};

    if (!localStorage) {
      console.warn('FeatureFlagsStorageService.retrieve failed: local storage is not accessible');
    } else {
      try {
        result = JSON.parse(localStorage[this.options.storageKey] ?? '{}');
      } catch (e) {
        console.error('FeatureFlagsStorageService.retrieve failed: ', e);
      }
    }

    return result;
  }
}
