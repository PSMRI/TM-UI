import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST credentials without captcha token when not provided', () => {
      service.login('user', 'pwd', false).subscribe();
      const req = httpMock.expectOne(environment.loginUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        userName: 'user',
        password: 'pwd',
        doLogout: false,
        withCredentials: true,
      });
      req.flush({});
    });

    it('should include captcha token when provided', () => {
      service.login('user', 'pwd', true, 'cap-token').subscribe();
      const req = httpMock.expectOne(environment.loginUrl);
      expect(req.request.body.captchaToken).toBe('cap-token');
      expect(req.request.body.doLogout).toBeTrue();
      req.flush({});
    });

    it('should omit captcha token when it is an empty string', () => {
      service.login('user', 'pwd', false, '').subscribe();
      const req = httpMock.expectOne(environment.loginUrl);
      expect(req.request.body.captchaToken).toBeUndefined();
      req.flush({});
    });

    it('should propagate login failures', () => {
      let status = 0;
      service
        .login('user', 'bad', false)
        .subscribe({ error: (e) => (status = e.status) });
      httpMock
        .expectOne(environment.loginUrl)
        .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      expect(status).toBe(401);
    });
  });

  it('userlogoutPreviousSession should POST the user name', () => {
    service.userlogoutPreviousSession('user').subscribe();
    const req = httpMock.expectOne(environment.userLogoutPreviousSessionUrl);
    expect(req.request.body).toEqual({ userName: 'user' });
    req.flush({});
  });

  it('getUserSecurityQuestionsAnswer should lower-case the user name', () => {
    service.getUserSecurityQuestionsAnswer('MixedCase').subscribe();
    const req = httpMock.expectOne(
      environment.getUserSecurityQuestionsAnswerUrl,
    );
    expect(req.request.body).toEqual({ userName: 'mixedcase' });
    req.flush({});
  });

  it('getUserSecurityQuestionsAnswer should throw for an undefined user name', () => {
    expect(() => service.getUserSecurityQuestionsAnswer(undefined)).toThrow();
  });

  it('validateSecurityQuestionAndAnswer should POST answers and lower-cased user', () => {
    const answers = [{ questionId: 1, answer: 'x' }];
    service.validateSecurityQuestionAndAnswer(answers, 'USER').subscribe();
    const req = httpMock.expectOne(environment.validateSecurityQuestions);
    expect(req.request.body).toEqual({
      SecurityQuesAns: answers,
      userName: 'user',
    });
    req.flush({});
  });

  it('getTransactionIdForChangePassword should POST lower-cased user', () => {
    service.getTransactionIdForChangePassword('USER').subscribe();
    const req = httpMock.expectOne(environment.getTransacIDForPasswordChange);
    expect(req.request.body).toEqual({ userName: 'user' });
    req.flush({});
  });

  it('getSecurityQuestions should GET the questions', () => {
    service.getSecurityQuestions().subscribe();
    const req = httpMock.expectOne(environment.getSecurityQuestionUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('saveUserSecurityQuestionsAnswer should POST the payload as-is', () => {
    const payload = [{ q: 1 }];
    service.saveUserSecurityQuestionsAnswer(payload).subscribe();
    const req = httpMock.expectOne(
      environment.saveUserSecurityQuestionsAnswerUrl,
    );
    expect(req.request.body).toBe(payload);
    req.flush({});
  });

  it('setNewPassword should use the stored transactionId, not the argument', () => {
    service.transactionId = 'stored-tx';
    service.setNewPassword('user', 'newPwd', 'arg-tx').subscribe();
    const req = httpMock.expectOne(environment.setNewPasswordUrl);
    expect(req.request.body).toEqual({
      userName: 'user',
      password: 'newPwd',
      transactionId: 'stored-tx',
    });
    req.flush({});
  });

  it('validateSessionKey should POST an empty body', () => {
    service.validateSessionKey().subscribe();
    const req = httpMock.expectOne(environment.getSessionExistsURL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('logout should POST to logout url', () => {
    service.logout().subscribe();
    const req = httpMock.expectOne(environment.logoutUrl);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('getSwymedLogout should GET swymed logout url', () => {
    service.getSwymedLogout().subscribe();
    httpMock.expectOne(environment.getSwymedLogoutUrl).flush({});
  });

  it('getUIVersionAndCommitDetails should GET the given url', () => {
    service.getUIVersionAndCommitDetails('version.json').subscribe();
    httpMock.expectOne('version.json').flush({});
  });

  it('getAPIVersionAndCommitDetails should GET api version url and surface errors', () => {
    let status = 0;
    service
      .getAPIVersionAndCommitDetails()
      .subscribe({ error: (e) => (status = e.status) });
    httpMock
      .expectOne(environment.apiVersionUrl)
      .flush('down', { status: 503, statusText: 'Unavailable' });
    expect(status).toBe(503);
  });
});
