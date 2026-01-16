import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { catchError, tap, finalize } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { throwError } from 'rxjs/internal/observable/throwError';
import { MatDialog } from '@angular/material/dialog';
import { SpinnerService } from './spinner.service';
import { ConfirmationService } from './confirmation.service';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

/**
 * HTTP Interceptor Service
 * Handles:
 * - Request authorization headers
 * - Response success/error handling
 * - Session management and timeout
 * - Loading spinner management
 * - User feedback on errors
 */
@Injectable({
  providedIn: 'root',
})
export class HttpInterceptorService implements HttpInterceptor {
  private sessionTimeoutRef: any;
  private currentLanguageSet: any;
  private readonly SESSION_TIMEOUT_DURATION = 27 * 60 * 1000; // 27 minutes
  private readonly SESSION_WARNING_TIME = 1.5 * 60 * 1000; // 1.5 minutes before timeout
  private readonly EXCLUDED_SPINNER_URLS = [
    environment.syncDownloadProgressUrl,
    environment.ioturl,
  ];

  constructor(
    private spinnerService: SpinnerService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private http: HttpClient,
    readonly sessionStorage: SessionStorageService,
    private matDialog: MatDialog,
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    // Add authorization header
    const modifiedReq = this.addAuthorizationHeader(req);

    // Show spinner unless URL is in exclusion list
    const shouldShowSpinner = !this.isExcludedUrl(req.url);
    if (shouldShowSpinner) {
      this.spinnerService.setLoading(true);
    }

    return next.handle(modifiedReq).pipe(
      tap((event: HttpEvent<any>) => this.handleResponse(event)),
      catchError((error: HttpErrorResponse) =>
        this.handleError(error, req.url),
      ),
      finalize(() => {
        if (shouldShowSpinner) {
          this.spinnerService.setLoading(false);
        }
      }),
    );
  }

  /**
   * Adds authorization header to request
   * Special handling for platform-feedback endpoint (no auth required)
   */
  private addAuthorizationHeader(req: HttpRequest<any>): HttpRequest<any> {
    const authToken = sessionStorage.getItem('key');
    const isPlatformFeedback = req.url
      ?.toLowerCase()
      .includes('/platform-feedback');

    if (isPlatformFeedback) {
      // Remove Authorization for feedback endpoint
      return req.clone({
        headers: req.headers
          .delete('Authorization')
          .set('Content-Type', 'application/json'),
      });
    }

    let headers = req.headers;

    if (req.body instanceof FormData) {
      headers = headers.set('Authorization', authToken || '');
    } else {
      headers = headers
        .set('Authorization', authToken || '')
        .set('Content-Type', 'application/json');
    }

    return req.clone({ headers });
  }

  /**
   * Check if URL is excluded from spinner display
   */
  private isExcludedUrl(url: string): boolean {
    return (
      url === undefined ||
      url.includes('cti/getAgentState') ||
      this.EXCLUDED_SPINNER_URLS.some((excludedUrl) => url.includes(excludedUrl))
    );
  }

  /**
   * Handle successful HTTP responses
   * Checks for application-level errors in response body
   */
  private handleResponse(event: HttpEvent<any>): void {
    if (event instanceof HttpResponse) {
      const response = event.body;

      // Check for application-level errors (statusCode in body)
      if (
        response &&
        typeof response === 'object' &&
        response.statusCode === 5002 &&
        !event.url?.includes('user/userAuthenticate')
      ) {
        this.handleSessionExpired();
        return;
      }

      // Reset session timeout on successful response
      this.resetSessionTimeout();
    }
  }

  /**
   * Handle HTTP errors with appropriate user-facing messages
   */
  private handleError(
    error: HttpErrorResponse,
    url: string,
  ): Observable<never> {
    const errorMessage = this.getErrorMessage(error);

    // Close all open dialogs before showing error
    this.matDialog.closeAll();

    // Show error based on status code
    switch (error.status) {
      case 401:
        this.handleUnauthorized();
        break;
      case 403:
        this.handleForbidden();
        break;
      case 404:
        this.handleNotFound(errorMessage);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        this.handleServerError(error.status, errorMessage);
        break;
      default:
        this.handleGenericError(errorMessage);
    }

    return throwError(() => error);
  }

  /**
   * Extract error message from HTTP response
   * Prioritizes server-provided messages over generic ones
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    // Try to get message from error response body
    if (error.error) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      if (
        error.error.message &&
        typeof error.error.message === 'string'
      ) {
        return error.error.message;
      }
      if (error.error.error && typeof error.error.error === 'string') {
        return error.error.error;
      }
    }

    // Fallback to HTTP status text
    return error.statusText || 'Unknown error occurred';
  }

  /**
   * Handle 401 Unauthorized - Session expired
   */
  private handleUnauthorized(): void {
    this.confirmationService.alert(
      this.currentLanguageSet?.sessionExpiredPleaseLogin ||
        'Session has expired, please login again.',
      'error',
    );
    this.handleSessionExpired();
  }

  /**
   * Handle 403 Forbidden - Access denied
   */
  private handleForbidden(): void {
    this.confirmationService.alert(
      this.currentLanguageSet?.accessDenied ||
        'Access Denied. You do not have permission to access this resource.',
      'error',
    );
    this.handleSessionExpired();
  }

  /**
   * Handle 404 Not Found
   */
  private handleNotFound(errorMessage: string): void {
    this.confirmationService.alert(
      this.currentLanguageSet?.notFound || `Resource not found: ${errorMessage}`,
      'error',
    );
  }

  /**
   * Handle 5xx Server Errors
   */
  private handleServerError(status: number, errorMessage: string): void {
    const message =
      this.currentLanguageSet?.internaleServerError ||
      `Server error (${status}): ${errorMessage}`;

    this.confirmationService.alert(message, 'error');
  }

  /**
   * Handle generic/unknown errors
   */
  private handleGenericError(errorMessage: string): void {
    const message =
      this.currentLanguageSet?.somethingWentWrong ||
      `Something went wrong: ${errorMessage}`;

    this.confirmationService.alert(message, 'error');
  }

  /**
   * Handle session expiration - clear storage and redirect
   */
  private handleSessionExpired(): void {
    this.clearSessionTimeout();
    sessionStorage.clear();
    this.sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  /**
   * Reset session timeout on user activity
   */
  private resetSessionTimeout(): void {
    this.clearSessionTimeout();
    this.startSessionTimeout();
  }

  /**
   * Start session timeout timer
   * Warns user 1.5 minutes before actual timeout (27 minutes total)
   */
  private startSessionTimeout(): void {
    this.sessionTimeoutRef = setTimeout(() => {
      const isAuthenticated =
        sessionStorage.getItem('authenticationToken') &&
        sessionStorage.getItem('isAuthenticated');

      if (isAuthenticated) {
        this.showSessionTimeoutWarning();
      }
    }, this.SESSION_TIMEOUT_DURATION);
  }

  /**
   * Show session timeout warning dialog
   */
  private showSessionTimeoutWarning(): void {
    this.confirmationService
      .alert(
        'Your session is about to expire. Do you need more time?',
        'sessionTimeOut',
      )
      .afterClosed()
      .subscribe((result: any) => {
        if (!result) return;

        if (result.action === 'continue') {
          this.extendSession();
        } else if (result.action === 'timeout' || result.action === 'cancel') {
          this.handleSessionExpired();
        }
      });
  }

  /**
   * Extend user session by calling backend endpoint
   */
  private extendSession(): void {
    this.http.post(environment.extendSessionUrl, {}).subscribe(
      (res: any) => {
        // Session extended successfully, restart timeout
        this.resetSessionTimeout();
      },
      (err: any) => {
        // Silently fail - let normal error handling take over
        console.warn('Failed to extend session', err);
      },
    );
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(): void {
    if (this.sessionTimeoutRef) {
      clearTimeout(this.sessionTimeoutRef);
      this.sessionTimeoutRef = null;
    }
  }
}
