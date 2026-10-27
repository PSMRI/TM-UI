import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { InventoryService } from './inventory.service';
import { ConfirmationService } from './confirmation.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let confirmation: jasmine.SpyObj<ConfirmationService>;
  let store: Record<string, any>;
  const fakeDocument: any = {
    location: { protocol: 'https:', host: 'amrit.org', pathname: '/tm/' },
  };

  beforeEach(() => {
    store = {};
    confirmation = jasmine.createSpyObj('ConfirmationService', ['alert']);
    // DOCUMENT is passed directly; overriding it in TestBed breaks teardown
    service = new InventoryService(fakeDocument, confirmation, {
      getItem: (k: string) => store[k] ?? null,
    } as SessionStorageService);
    spyOn(console, 'log');
    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  it('getParentAPI should return environment.parentAPI', () => {
    expect(service.getParentAPI()).toBe(environment.parentAPI);
  });

  it('getAuthKey should return key only when authenticated', () => {
    sessionStorage.setItem('key', 'abc');
    expect(service.getAuthKey()).toBeUndefined();
    sessionStorage.setItem('isAuthenticated', 'true');
    expect(service.getAuthKey()).toBe('abc');
  });

  it('getFacilityID should read from encrypted storage only when raw key exists', () => {
    store['facilityID'] = '7';
    expect(service.getFacilityID()).toBeUndefined();
    sessionStorage.setItem('facilityID', 'enc');
    expect(service.getFacilityID()).toBe('7');
  });

  it('getProtocol / getHost should read document location', () => {
    expect(service.getProtocol()).toBe('https:');
    expect(service.getHost()).toBe('amrit.org/tm/');
  });

  it('getVanID / getppID should parse serviceLineDetails', () => {
    store['serviceLineDetails'] = JSON.stringify({
      vanID: 11,
      parkingPlaceID: 22,
    });
    expect(service.getVanID()).toBe(11);
    expect(service.getppID()).toBe(22);
  });

  it('getVanID should throw when serviceLineDetails is missing', () => {
    expect(() => service.getVanID()).toThrow();
  });

  it('getServiceDetails should return serviceName', () => {
    store['serviceName'] = 'TM';
    expect(service.getServiceDetails()).toBe('TM');
  });

  describe('moveToInventory', () => {
    beforeEach(() => {
      store['serviceLineDetails'] = JSON.stringify({
        vanID: 1,
        parkingPlaceID: 2,
      });
      service.current_language_set = {
        alerts: { info: { noFacilityMapper: 'No facility mapped' } },
      };
    });

    it('should alert when no facility is mapped', () => {
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('key', 'abc');
      service.moveToInventory(1, 2, 3, 'English', 4, 'hid');
      expect(confirmation.alert).toHaveBeenCalledWith(
        'No facility mapped',
        'error',
      );
      expect(service.inventoryUrl).toBeUndefined();
    });

    it('should alert when user is not authenticated', () => {
      sessionStorage.setItem('facilityID', 'enc');
      store['facilityID'] = '7';
      service.moveToInventory(1, 2, 3, 'English', 4, 'hid');
      expect(confirmation.alert).toHaveBeenCalled();
      expect(service.inventoryUrl).toBeUndefined();
    });

    it('should throw when language set is not loaded and facility is missing', () => {
      service.current_language_set = undefined;
      expect(() =>
        service.moveToInventory(1, 2, 3, 'English', 4, 'hid'),
      ).toThrow();
    });
  });
});
