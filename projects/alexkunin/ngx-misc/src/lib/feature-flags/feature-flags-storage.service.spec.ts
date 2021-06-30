import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { FeatureFlagsStorageService, FeatureFlagsStorageServiceOptions } from './feature-flags-storage.service';

let consoleErrorSpy: jest.SpyInstance;
beforeAll(() => consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => null));
afterAll(() => consoleErrorSpy.mockRestore());

describe('FeatureFlagsStorageService', () => {
  let service: FeatureFlagsStorageService;
  let storageMock: { someKey?: string };

  beforeEach(() => {
    storageMock = {};
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useFactory: () => ({ defaultView: { localStorage: storageMock } }),
        },
        {
          provide: FeatureFlagsStorageServiceOptions,
          useValue: new FeatureFlagsStorageServiceOptions('someKey'),
        },
        FeatureFlagsStorageService,
      ],
    });
    service = TestBed.inject(FeatureFlagsStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  test('store()', () => {
    service.store({ c: true, d: false });
    expect(storageMock).toEqual({ someKey: JSON.stringify({ c: true, d: false }) });
  });

  test('retrieve()', () => {
    expect(service.retrieve()).toEqual({});
    storageMock.someKey = JSON.stringify({ a: true, b: false });
    expect(service.retrieve()).toEqual({ a: true, b: false });
    storageMock.someKey = 'invalid value';
    expect(service.retrieve()).toEqual({});
  });
});
