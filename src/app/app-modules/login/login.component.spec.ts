/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { AuthService } from 'src/app/app-modules/core/services/auth.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { MatDialog } from '@angular/material/dialog';
import { DataSyncLoginComponent } from 'src/app/app-modules/data-sync/data-sync-login/data-sync-login.component';
import { MasterDownloadComponent } from 'src/app/app-modules/data-sync/master-download/master-download.component';
import { LoginComponent } from './login.component';

const ALREADY_LOGGED_IN =
  'You are already logged in,please confirm to logout from other device and login again';

function loginData(overrides: any = {}) {
  return {
    key: 'KEY1',
    isAuthenticated: true,
    userID: 42,
    userName: 'nurse1',
    fullName: 'Nurse One',
    Status: 'Active',
    previlegeObj: [
      {
        serviceID: 7,
        serviceName: 'HWC',
        apimanClientKey: 'apikey',
        roles: [
          {
            RoleName: 'Nurse',
            teleConsultation: ['n-tc'],
            serviceRoleScreenMappings: [
              {
                providerServiceMapping: {
                  serviceID: 9,
                  serviceProviderID: 3,
                },
              },
            ],
          },
          {
            RoleName: 'Doctor',
            teleConsultation: ['d-tc'],
            serviceRoleScreenMappings: [
              {
                providerServiceMapping: {
                  serviceID: 9,
                  serviceProviderID: 3,
                },
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: any;
  let confirm: any;
  let session: any;
  let tracking: any;
  let dialog: any;
  let router: Router;
  let savedSession: Record<string, string>;

  beforeEach(async () => {
    savedSession = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i) as string;
      savedSession[k] = sessionStorage.getItem(k) as string;
    }
    sessionStorage.clear();
    auth = autoSpy(AuthService, { sessionExpiredHandled: true });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [LoginComponent],
      providers: [
        ...commonTestProviders(),
        { provide: AuthService, useValue: auth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
    dialog = TestBed.inject(MatDialog);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  afterEach(() => {
    sessionStorage.clear();
    Object.entries(savedSession).forEach(([k, v]) =>
      sessionStorage.setItem(k, v),
    );
  });

  function fill(user = ' nurse1 ', pwd = 'Secret@1') {
    component.loginForm.setValue({ userName: user, password: pwd });
  }

  describe('ngOnInit', () => {
    it('clears session storage when not authenticated', () => {
      sessionStorage.setItem('junk', 'x');
      component.ngOnInit();
      expect(sessionStorage.getItem('junk')).toBeNull();
      expect(auth.validateSessionKey).not.toHaveBeenCalled();
    });

    it('navigates to /service when an authenticated session key is valid', () => {
      sessionStorage.setItem('isAuthenticated', 'true');
      auth.validateSessionKey.and.returnValue(
        of({ statusCode: 200, data: { ok: true } }),
      );
      component.ngOnInit();
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
    });

    it('stays on login when the session key is not valid', () => {
      sessionStorage.setItem('isAuthenticated', 'true');
      auth.validateSessionKey.and.returnValue(of({ statusCode: 5000 }));
      component.ngOnInit();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('renders the form with the template', () => {
      fixture.detectChanges();
      expect(component.loginForm.valid).toBeFalse();
      expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    });
  });

  it('AfterViewInit focuses the user name field', () => {
    const el = { focus: jasmine.createSpy('focus') };
    (component as any).elementRef = { nativeElement: el };
    component.AfterViewInit();
    expect(el.focus).toHaveBeenCalled();
  });

  it('exposes keySize and iterationCount accessors', () => {
    expect(component.keySize).toBe(256);
    expect(component.iterationCount).toBe(1989);
    component.keySize = 128;
    component.iterationCount = 10;
    expect(component.keySize).toBe(128);
    expect(component.iterationCount).toBe(10);
  });

  it('encrypt returns salt(64 hex) + iv(32 hex) + base64 ciphertext', () => {
    const out = component.encrypt(component.Key_IV, 'hello');
    expect(out.length).toBeGreaterThan(96);
    expect(/^[0-9a-f]{96}/.test(out)).toBeTrue();
    // random salt/iv, so two encryptions differ
    expect(component.encrypt(component.Key_IV, 'hello')).not.toBe(out);
  });

  it('encryptWithIvSalt is deterministic for fixed salt and iv', () => {
    const salt = 'a'.repeat(64);
    const iv = 'b'.repeat(32);
    const a = component.encryptWithIvSalt(salt, iv, 'pass', 'text');
    const b = component.encryptWithIvSalt(salt, iv, 'pass', 'text');
    expect(a).toBe(b);
    expect(a).not.toBe(component.encryptWithIvSalt(salt, iv, 'pass', 'other'));
  });

  it('showPWD / hidePWD toggle the input type', () => {
    component.showPWD();
    expect(component.dynamictype).toBe('text');
    component.hidePWD();
    expect(component.dynamictype).toBe('password');
  });

  describe('login', () => {
    it('does nothing when the form is empty', () => {
      component.login();
      expect(auth.login).not.toHaveBeenCalled();
    });


    it('passes the captcha token when captcha is enabled', () => {
      component.enableCaptcha = true;
      component.onCaptchaResolved('tok');
      fill();
      auth.login.and.returnValue(of({ statusCode: 200, data: loginData() }));
      component.login();
      expect(auth.login.calls.mostRecent().args[3]).toBe('tok');
    });



    it('alerts when the response has no privileges', () => {
      fill();
      auth.login.and.returnValue(
        of({ statusCode: 200, data: { previlegeObj: [] } }),
      );
      component.login();
      expect(confirm.alert).toHaveBeenCalledWith(
        'Seems you are logged in from somewhere else, Logout from there & try back in.',
        'error',
      );
    });

    it('alerts a generic 5002 error and resets the captcha', () => {
      const cmp = { reset: jasmine.createSpy('reset') };
      component.enableCaptcha = true;
      component.captchaCmp = cmp as any;
      component.captchaToken = 'tok';
      fill();
      auth.login.and.returnValue(
        of({ statusCode: 5002, errorMessage: 'Bad credentials' }),
      );
      component.login();
      expect(confirm.alert).toHaveBeenCalledWith('Bad credentials', 'error');
      expect(cmp.reset).toHaveBeenCalled();
      expect(component.captchaToken).toBe('');
    });

    it('ignores other status codes', () => {
      fill();
      auth.login.and.returnValue(of({ statusCode: 500 }));
      component.login();
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('alerts the error when login call fails', () => {
      fill();
      auth.login.and.returnValue(throwingObs('net'));
      component.login();
      expect(confirm.alert).toHaveBeenCalledWith('net', 'error');
    });

  });

  describe('openDialog', () => {
    it('opens master download after data-sync login succeeds, then clears storage', () => {
      const firstRef = { afterClosed: () => of(true) };
      const secondRef = { afterClosed: () => of(undefined) };
      dialog.open.and.returnValues(firstRef, secondRef);
      sessionStorage.setItem('junk', '1');
      component.openDialog();
      expect(dialog.open.calls.argsFor(0)[0]).toBe(DataSyncLoginComponent);
      expect(dialog.open.calls.argsFor(0)[1].data).toEqual({
        masterDowloadFirstTime: true,
      });
      expect(dialog.open.calls.argsFor(1)[0]).toBe(MasterDownloadComponent);
      expect(sessionStorage.getItem('junk')).toBeNull();
      expect(session.clear).toHaveBeenCalled();
    });

    it('does not open master download when data-sync login is cancelled', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(false) });
      component.openDialog();
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(session.clear).not.toHaveBeenCalled();
    });
  });

  describe('resetCaptcha', () => {
    it('does nothing when captcha is disabled', () => {
      const cmp = { reset: jasmine.createSpy('reset') };
      component.enableCaptcha = false;
      component.captchaCmp = cmp as any;
      component.captchaToken = 'tok';
      component.resetCaptcha();
      expect(cmp.reset).not.toHaveBeenCalled();
      expect(component.captchaToken).toBe('tok');
    });

    it('does nothing when there is no captcha component', () => {
      component.enableCaptcha = true;
      component.captchaCmp = undefined;
      component.captchaToken = 'tok';
      component.resetCaptcha();
      expect(component.captchaToken).toBe('tok');
    });
  });
});
