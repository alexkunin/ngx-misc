import { from, interval, Observable, zip } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { FeatureFlagsStorageService, FeatureFlagsStorageServiceOptions } from './feature-flags-storage.service';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlag, FeatureFlagManager } from './feature-flags.types';

describe('FeatureFlagsService', () => {
  const featureFlags = [
    new FeatureFlag(
      'a',
      'A',
      'Description 1',
      true,
    ),
    new FeatureFlag(
      'b',
      'B',
      'Description 2',
      false,
    ),
  ];
  let service: FeatureFlagsService;
  let storageMock: { someKey?: string };

  beforeEach(() => {
    storageMock = {};
    service = new FeatureFlagsService(
      new FeatureFlagsStorageService(
        { defaultView: { localStorage: storageMock } } as Document,
        new FeatureFlagsStorageServiceOptions('someKey'),
      ),
    );
    service.setFeatureFlags(featureFlags);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  test('should return default values', () => {
    expect(service.isEnabled('a')).toEqual(true);
    expect(service.isEnabled('b')).toEqual(false);
  });

  test('should use values from storage', () => {
    storageMock.someKey = JSON.stringify({ a: false, b: true });
    expect(service.isEnabled('a')).toEqual(false);
    expect(service.isEnabled('b')).toEqual(true);
  });

  test('should fall back to default value if stored value is not boolean', () => {
    storageMock.someKey = JSON.stringify({ a: 1, b: 'k' });
    expect(service.isEnabled('a')).toEqual(true);
    expect(service.isEnabled('b')).toEqual(false);
  });

  describe('getDefinedFeatures', () => {
    it('should return defined feature flags', () => {
      expect(service.getDefinedFeatures()).toMatchObject([
        { id: 'a', caption: 'A', description: 'Description 1', defaultValue: true },
        { id: 'b', caption: 'B', description: 'Description 2', defaultValue: false },
      ]);
    });
  });

  describe('setFeatureState()', () => {
    test('setting to true should enable feature', () => {
      expect(service.isEnabled('b')).toEqual(false);
      service.setFeatureState('b', true);
      expect(service.isEnabled('b')).toEqual(true);
    });

    test('setting to false should disable feature', () => {
      expect(service.isEnabled('a')).toEqual(true);
      service.setFeatureState('a', false);
      expect(service.isEnabled('a')).toEqual(false);
    });
  });

  describe('getEventStream()', () => {
    describe('should emit current values', () => {
      test('should emit initial value and all enable/disable events', () => {
        new TestScheduler((actual, expected) => expect(actual).toEqual(expected)).run(({ expectObservable }) => {
          expectObservable(service.getEventStream()).toBe(
            'ijklm|',
            {
              i: { a: true, b: false },
              j: { a: false, b: false },
              k: { a: false, b: false },
              l: { a: true, b: false },
              m: { a: true, b: true },
            },
          );

          zip(
            from([
              () => service.setFeatureState('a', false),
              () => service.setFeatureState('a', false),
              () => service.setFeatureState('a', true),
              () => service.setFeatureState('b', true),
              () => service.cleanUp(),
            ]),
            interval(1),
          ).subscribe(([ f, _ ]) => f());
        });
      });

      test('should allow subscribing to specific feature', () => {
        new TestScheduler((actual, expected) => expect(actual).toEqual(expected)).run(({ expectObservable }) => {
          expectObservable(service.getEventStream('a')).toBe(
            'ij-l-|',
            {
              i: true,
              j: false,
              l: true,
            },
          );

          zip(
            from([
              () => service.setFeatureState('a', false),
              () => service.setFeatureState('a', false),
              () => service.setFeatureState('a', true),
              () => service.setFeatureState('b', true),
              () => service.cleanUp(),
            ]),
            interval(1),
          ).subscribe(([ f, _ ]) => f());
        });
      });
    });
  });

  test('hasAnyOverrides()', () => {
    expect(service.hasAnyOverrides()).toBeFalsy();
    service.setFeatureState('b', true);
    expect(service.hasAnyOverrides()).toBeTruthy();
    service.setFeatureState('b', false);
    expect(service.hasAnyOverrides()).toBeFalsy();
  });

  test('getManager()', () => {
    const manager = service.getManager() as FeatureFlagManager<typeof featureFlags>;
    expect(manager.isAEnabled()).toEqual(true);
    expect(manager.aEnabled$).toBeInstanceOf(Observable);
  });
});
