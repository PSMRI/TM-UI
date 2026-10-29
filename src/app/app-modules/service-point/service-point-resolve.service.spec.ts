import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ServicePointResolve } from './service-point-resolve.service';
import { ServicePointService } from './service-point.service';

describe('ServicePointResolve', () => {
  let resolver: ServicePointResolve;
  let spService: jasmine.SpyObj<ServicePointService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    spService = jasmine.createSpyObj('ServicePointService', ['getServicePoints']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    resolver = new ServicePointResolve(spService, router, {
      getItem: (k: string) => (k === 'providerServiceID' ? '13' : null),
    } as SessionStorageService);
  });

  it('should request service points for the provider and return the response', () => {
    const res = { statusCode: 200, data: [{ servicePointID: 1 }] };
    spService.getServicePoints.and.returnValue(of(res));
    let resolved: any;
    resolver.resolve({} as any).subscribe((r) => (resolved = r));
    expect(spService.getServicePoints).toHaveBeenCalledWith('13');
    expect(resolved).toBe(res);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /service and resolve null on empty response', () => {
    spService.getServicePoints.and.returnValue(of(null as any));
    let resolved: any = 'unset';
    resolver.resolve({} as any).subscribe((r) => (resolved = r));
    expect(resolved).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/service']);
  });

  it('should propagate API errors without redirecting', () => {
    spService.getServicePoints.and.returnValue(throwError(() => new Error('down')));
    let error: any;
    resolver.resolve({} as any).subscribe({ error: (e) => (error = e) });
    expect(error.message).toBe('down');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
