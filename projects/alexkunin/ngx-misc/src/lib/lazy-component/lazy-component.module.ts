import { CommonModule } from '@angular/common';
import {
  ApplicationRef,
  Component,
  ComponentFactoryResolver,
  inject,
  InjectionToken,
  Injector,
  ModuleWithProviders,
  NgModule,
  Type,
} from '@angular/core';
import { ActivatedRoute, ActivationEnd, Router, RouterModule, ROUTES } from '@angular/router';
import { defer, Observable, Subject } from 'rxjs';
import { filter, shareReplay } from 'rxjs/operators';

// XXX: no idea how to test all of this

type Loader<C = any> = (path: string) => Observable<Type<C>>;

const OUTLET_NAME = '$lco';

export const LAZY_COMPONENT_LOADER = new InjectionToken<Loader>(
  'LAZY_COMPONENT_LOADER',
  {
    factory() {
      const applicationRef = inject(ApplicationRef);
      const componentFactoryResolver = inject(ComponentFactoryResolver);
      const router = inject(Router);
      const activatedRoute = inject(ActivatedRoute);

      const componentFactory = componentFactoryResolver.resolveComponentFactory(OutletContainerComponent);
      const injector = Injector.create({ providers: [] });
      const componentRef = componentFactory.create(injector);
      applicationRef.attachView(componentRef.hostView);

      let nextRequestId = 1;
      const subjects = new Map<string, Subject<Type<any>>>();

      router.events.pipe(
        filter((e): e is ActivationEnd => e instanceof ActivationEnd),
      ).subscribe(({ snapshot: { data: { payload }, queryParams: { requestId } } }) => {
        if (requestId && payload) {
          const subject = subjects.get(requestId);
          subjects.delete(requestId);
          subject?.next(payload);
          subject?.complete();
        }
      });

      return path => {
        const requestId = (nextRequestId++).toString();
        const subject = new Subject<Type<any>>();
        subjects.set(requestId, subject);

        const navigate = (path: string | null, requestId?: string): Promise<boolean> =>
          router.navigate(
            [ { outlets: { [OUTLET_NAME]: path } } ],
            { skipLocationChange: true, queryParams: { requestId }, relativeTo: activatedRoute },
          );

        Promise
          .resolve(null)
          .then(() => navigate(path, requestId))
          .then(success => success || Promise.reject('Failed lazy-loading component'))
          .then(() => navigate(null))
          .catch(e => subject.error(e));

        return subject.asObservable();
      };
    },
  },
);

@Component({ template: '<router-outlet name="' + OUTLET_NAME + '"></router-outlet>' })
export class OutletContainerComponent {
}

@Component({ template: '' })
export class EmptyComponent {
}

@NgModule({
  declarations: [
    OutletContainerComponent,
    EmptyComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
})
export class LazyComponentModule {
  static forChild(component: Type<any>): ModuleWithProviders<LazyComponentModule> {
    return {
      ngModule: LazyComponentModule,
      providers: [
        RouterModule.forChild([
          {
            path: '',
            component: EmptyComponent,
            data: {
              payload: component,
            },
          },
        ]).providers ?? [],
      ],
    };
  }

  static forRoot(components: { token: any, loader: () => Promise<any> }[]): ModuleWithProviders<LazyComponentModule> {
    return {
      ngModule: LazyComponentModule,
      providers: [
        {
          provide: ROUTES,
          multi: true,
          useValue: components.map(({ loader }, i) => ({
            path: OUTLET_NAME + i,
            outlet: OUTLET_NAME,
            loadChildren: loader,
          })),
        },
        ...components.map(({ token }, i) => ({
          provide: token,
          deps: [ LAZY_COMPONENT_LOADER ],
          useFactory: (loader: Loader) => defer(() => loader(OUTLET_NAME + i)).pipe(
            shareReplay(1),
          ),
        })),
      ],
    };
  }
}
