import { TelemedicineService } from './telemedicine.service';
import { ConfirmationService } from './confirmation.service';

describe('TelemedicineService', () => {
  let service: TelemedicineService;
  const fakeDocument: any = {
    location: { protocol: 'https:', host: 'amrit.org', pathname: '/tm/' },
  };

  beforeEach(() => {
    // DOCUMENT is passed directly; overriding it in TestBed breaks teardown
    service = new TelemedicineService(
      fakeDocument,
      {} as ConfirmationService,
    );
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('key');
  });

  afterEach(() => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('key');
  });

  it('getAuthKey should return the key when authenticated', () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('key', 'abc');
    expect(service.getAuthKey()).toBe('abc');
  });

  it('getAuthKey should return null when not authenticated', () => {
    sessionStorage.setItem('key', 'abc');
    expect(service.getAuthKey()).toBeNull();
  });

  it('getProtocol / getHost should read from the document location', () => {
    expect(service.getProtocol()).toBe('https:');
    expect(service.getHost()).toBe('amrit.org/tm/');
  });

  it('routeToTeleMedecine should not build a url when not authenticated', () => {
    service.routeToTeleMedecine();
    expect(service.telemedicineUrl).toBeUndefined();
  });
});
