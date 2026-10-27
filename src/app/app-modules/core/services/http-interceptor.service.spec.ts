import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHandler,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { HttpInterceptorService } from './http-interceptor.service';
import { SpinnerService } from './spinner.service';
import { ConfirmationService } from './confirmation.service';

describe('HttpInterceptorService', () => {
  let interceptor: HttpInterceptorService;
  let spinner: jasmine.SpyObj<SpinnerService>;
  let router: jasmine.SpyObj<Router>;
  let confirmation: jasmine.SpyObj<ConfirmationService>;
  let http: jasmine.SpyObj<HttpClient>;
  let storage: jasmine.SpyObj<SessionStorageService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let handledReq: HttpRequest<any>;

  const TIMEOUT = 27 * 60 * 1000;

  const handlerReturning = (obs: any): HttpHandler => ({
    handle: (r: HttpRequest<any>) => {
      handledReq = r;
      return obs;
    },
  });

  const okHandler = (body: any = {}, url = '/api/x') =>
    handlerReturning(of(new HttpResponse({ body, url, status: 200 })));

  const errorHandler = (status: number, error: any = null, statusText = '') =>
    handlerReturning(
      throwError(() => new HttpErrorResponse({ status, error, statusText })),
    );

  const run = (req: HttpRequest<any>, handler: HttpHandler) => {
    let err: any;
    interceptor.intercept(req, handler).subscribe({ error: (e) => (err = e) });
    return err;
  };

  beforeEach(() => {
    spinner = jasmine.createSpyObj('SpinnerService', ['setLoading']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    confirmation = jasmine.createSpyObj('ConfirmationService', ['alert']);
    http = jasmine.createSpyObj('HttpClient', ['post']);
    storage = jasmine.createSpyObj('SessionStorageService', ['clear']);
    matDialog = jasmine.createSpyObj('MatDialog', ['closeAll']);

    TestBed.configureTestingModule({
      providers: [
        HttpInterceptorService,
        { provide: SpinnerService, useValue: spinner },
        { provide: Router, useValue: router },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: HttpClient, useValue: http },
        { provide: SessionStorageService, useValue: storage },
        { provide: MatDialog, useValue: matDialog },
      ],
    });
    interceptor = TestBed.inject(HttpInterceptorService);
    sessionStorage.clear();
  });

  afterEach(() => {
    // clear any pending session timer
    (interceptor as any).clearSessionTimeout();
    sessionStorage.clear();
  });

  describe('request headers', () => {
    it('should add Authorization and JSON content type', () => {
      sessionStorage.setItem('key', 'token-1');
      run(new HttpRequest('POST', '/api/x', { a: 1 }), okHandler());
      expect(handledReq.headers.get('Authorization')).toBe('token-1');
      expect(handledReq.headers.get('Content-Type')).toBe('application/json');
    });

    it('should send empty Authorization when no token exists', () => {
      run(new HttpRequest('GET', '/api/x'), okHandler());
      expect(handledReq.headers.get('Authorization')).toBe('');
    });

    it('should not force JSON content type for FormData bodies', () => {
      sessionStorage.setItem('key', 'token-1');
      run(new HttpRequest('POST', '/api/upload', new FormData()), okHandler());
      expect(handledReq.headers.get('Authorization')).toBe('token-1');
      expect(handledReq.headers.has('Content-Type')).toBeFalse();
    });

    it('should strip Authorization for platform-feedback endpoints', () => {
      sessionStorage.setItem('key', 'token-1');
      const req = new HttpRequest('POST', '/common/Platform-Feedback/save', {}, {
        headers: new HttpHeaders({ Authorization: 'old' }),
      });
      run(req, okHandler());
      expect(handledReq.headers.has('Authorization')).toBeFalse();
      expect(handledReq.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('spinner', () => {
    it('should toggle loading for normal urls', () => {
      run(new HttpRequest('GET', '/api/x'), okHandler());
      expect(spinner.setLoading.calls.allArgs()).toEqual([[true], [false]]);
    });

    it('should turn loading off after an error', () => {
      run(new HttpRequest('GET', '/api/x'), errorHandler(500));
      expect(spinner.setLoading).toHaveBeenCalledWith(false);
    });

    it('should skip spinner for cti agent state polling', () => {
      run(new HttpRequest('GET', '/cti/getAgentState'), okHandler());
      expect(spinner.setLoading).not.toHaveBeenCalled();
    });

    it('should skip spinner for sync download progress url', () => {
      run(
        new HttpRequest('GET', environment.syncDownloadProgressUrl),
        okHandler(),
      );
      expect(spinner.setLoading).not.toHaveBeenCalled();
    });
  });

  describe('responses', () => {
    it('should pass successful responses through', () => {
      let res: any;
      interceptor
        .intercept(new HttpRequest('GET', '/api/x'), okHandler({ data: 1 }))
        .subscribe((r) => (res = r));
      expect(res.body).toEqual({ data: 1 });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should expire session on statusCode 5002', () => {
      sessionStorage.setItem('key', 'x');
      run(new HttpRequest('GET', '/api/x'), okHandler({ statusCode: 5002 }));
      expect(storage.clear).toHaveBeenCalled();
      expect(sessionStorage.getItem('key')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should ignore statusCode 5002 from user/userAuthenticate', () => {
      run(
        new HttpRequest('POST', '/user/userAuthenticate', {}),
        okHandler({ statusCode: 5002 }, '/user/userAuthenticate'),
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should ignore non-object bodies', () => {
      run(new HttpRequest('GET', '/api/x'), okHandler('plain text'));
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('errors', () => {
    it('401 should alert and redirect to login', () => {
      const err = run(new HttpRequest('GET', '/api/x'), errorHandler(401));
      expect(err.status).toBe(401);
      expect(matDialog.closeAll).toHaveBeenCalled();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Session has expired, please login again.',
        'error',
      );
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('403 should alert access denied and redirect', () => {
      run(new HttpRequest('GET', '/api/x'), errorHandler(403));
      expect(confirmation.alert.calls.mostRecent().args[0]).toContain(
        'Access Denied',
      );
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('404 should alert with server message and not redirect', () => {
      run(
        new HttpRequest('GET', '/api/x'),
        errorHandler(404, { message: 'no such ben' }),
      );
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Resource not found: no such ben',
        'error',
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    [500, 502, 503, 504].forEach((status) => {
      it(`${status} should show a server error`, () => {
        run(
          new HttpRequest('GET', '/api/x'),
          errorHandler(status, 'down for maintenance'),
        );
        expect(confirmation.alert).toHaveBeenCalledWith(
          `Server error (${status}): down for maintenance`,
          'error',
        );
      });
    });

    it('should read nested error.error string', () => {
      run(
        new HttpRequest('GET', '/api/x'),
        errorHandler(400, { error: 'bad input' }),
      );
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Something went wrong: bad input',
        'error',
      );
    });

    it('should fall back to statusText then generic text', () => {
      run(new HttpRequest('GET', '/api/x'), errorHandler(400, null, 'Bad'));
      expect(confirmation.alert.calls.mostRecent().args[0]).toBe(
        'Something went wrong: Bad',
      );
      // HttpErrorResponse defaults statusText, so use a raw error object
      run(
        new HttpRequest('GET', '/api/x'),
        handlerReturning(
          throwError(() => ({ status: 0, error: {}, statusText: '' })),
        ),
      );
      expect(confirmation.alert.calls.mostRecent().args[0]).toBe(
        'Something went wrong: Unknown error occurred',
      );
    });

    it('should prefer translated messages when a language set is loaded', () => {
      (interceptor as any).currentLanguageSet = {
        internaleServerError: 'Erreur serveur',
      };
      run(new HttpRequest('GET', '/api/x'), errorHandler(500));
      expect(confirmation.alert).toHaveBeenCalledWith('Erreur serveur', 'error');
    });
  });

  describe('session timeout', () => {
    const authenticate = () => {
      sessionStorage.setItem('authenticationToken', 't');
      sessionStorage.setItem('isAuthenticated', 'true');
    };
    const dialogResult = (result: any) =>
      confirmation.alert.and.returnValue({
        afterClosed: () => of(result),
      } as any);

    it('should warn after 27 minutes when authenticated', fakeAsync(() => {
      authenticate();
      dialogResult(null);
      run(new HttpRequest('GET', '/api/x'), okHandler());
      tick(TIMEOUT - 1);
      expect(confirmation.alert).not.toHaveBeenCalled();
      tick(1);
      expect(confirmation.alert).toHaveBeenCalledWith(
        jasmine.stringContaining('about to expire'),
        'sessionTimeOut',
      );
    }));

    it('should not warn when not authenticated', fakeAsync(() => {
      run(new HttpRequest('GET', '/api/x'), okHandler());
      tick(TIMEOUT);
      expect(confirmation.alert).not.toHaveBeenCalled();
    }));

    it('should restart the timer on each successful response', fakeAsync(() => {
      authenticate();
      dialogResult(null);
      run(new HttpRequest('GET', '/api/x'), okHandler());
      tick(TIMEOUT - 1000);
      run(new HttpRequest('GET', '/api/x'), okHandler());
      tick(2000);
      expect(confirmation.alert).not.toHaveBeenCalled();
      tick(TIMEOUT);
      expect(confirmation.alert).toHaveBeenCalledTimes(1);
    }));

    it('continue should extend the session', fakeAsync(() => {
      authenticate();
      dialogResult({ action: 'continue' });
      http.post.and.returnValue(of({}));
      run(new HttpRequest('GET', '/api/x'), okHandler());
      tick(TIMEOUT);
      expect(http.post).toHaveBeenCalledWith(environment.extendSessionUrl, {});
      expect(router.navigate).not.toHaveBeenCalled();
      (interceptor as any).clearSessionTimeout();
    }));

    it('should swallow extend-session failures', fakeAsync(() => {
      authenticate();
      dialogResult({ action: 'continue' });
      spyOn(console, 'warn');
      http.post.and.returnValue(throwError(() => new Error('fail')));
      run(new HttpRequest('GET', '/api/x'), okHandler());
      tick(TIMEOUT);
      expect(console.warn).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    }));

    ['timeout', 'cancel'].forEach((action) => {
      it(`${action} should log the user out`, fakeAsync(() => {
        authenticate();
        dialogResult({ action });
        run(new HttpRequest('GET', '/api/x'), okHandler());
        tick(TIMEOUT);
        expect(storage.clear).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      }));
    });
  });
});
