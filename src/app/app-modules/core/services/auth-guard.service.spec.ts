import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AuthGuard } from './auth-guard.service';
import { AuthService } from './auth.service';
import { HttpServiceService } from './http-service.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  const language$ = new BehaviorSubject<any>({ hello: 'Hello' });

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['validateSessionKey']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        {
          provide: HttpServiceService,
          useValue: { currentLangugae$: language$.asObservable() },
        },
      ],
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should pick up the current language set', () => {
    authService.validateSessionKey.and.returnValue(of({}));
    guard.canActivate({}, {}).subscribe();
    expect(guard.current_language_set).toEqual({ hello: 'Hello' });
  });

  it('should not redirect when session is valid', () => {
    const res = { statusCode: 200, data: { key: 'x' } };
    authService.validateSessionKey.and.returnValue(of(res));
    let emitted: any;
    guard.canActivate({}, {}).subscribe((r) => (emitted = r));
    expect(emitted).toBe(res);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when status code is not 200', () => {
    authService.validateSessionKey.and.returnValue(
      of({ statusCode: 5002, data: {} }),
    );
    guard.canActivate({}, {}).subscribe();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login when data is missing', () => {
    authService.validateSessionKey.and.returnValue(of({ statusCode: 200 }));
    guard.canActivate({}, {}).subscribe();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login on a null response', () => {
    authService.validateSessionKey.and.returnValue(of(null as any));
    guard.canActivate({}, {}).subscribe();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should propagate API failures without redirecting', () => {
    authService.validateSessionKey.and.returnValue(
      throwError(() => new Error('network')),
    );
    let error: any;
    guard.canActivate({}, {}).subscribe({ error: (e) => (error = e) });
    expect(error.message).toBe('network');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
