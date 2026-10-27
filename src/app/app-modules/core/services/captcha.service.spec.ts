import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { CaptchaService } from './captcha.service';

describe('CaptchaService', () => {
  let service: CaptchaService;
  let appended: HTMLScriptElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaptchaService);
    appended = [];
    spyOn(document.head, 'appendChild').and.callFake(<T extends Node>(n: T) => {
      appended.push(n as unknown as HTMLScriptElement);
      return n;
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should append an async, deferred script with the captcha url', () => {
    service.loadScript();
    expect(appended.length).toBe(1);
    const script = appended[0];
    expect(script.tagName).toBe('SCRIPT');
    expect(script.async).toBeTrue();
    expect(script.defer).toBeTrue();
    expect(script.getAttribute('src')).toBe(environment.captchaChallengeURL);
  });

  it('should resolve on load and not append again afterwards', async () => {
    const p = service.loadScript();
    (appended[0].onload as any)();
    await expectAsync(p).toBeResolved();

    await expectAsync(service.loadScript()).toBeResolved();
    expect(appended.length).toBe(1);
  });

  it('should reject on error and allow a retry', async () => {
    const p = service.loadScript();
    (appended[0].onerror as any)('boom');
    await expectAsync(p).toBeRejectedWithError(/Failed to load CAPTCHA script/);

    service.loadScript();
    expect(appended.length).toBe(2);
  });
});
