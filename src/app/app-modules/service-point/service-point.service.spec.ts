import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ServicePointService } from './service-point.service';

describe('ServicePointService', () => {
  let service: ServicePointService;
  let httpMock: HttpTestingController;
  let store: Record<string, any>;

  beforeEach(() => {
    store = {};
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ServicePointService,
        {
          provide: SessionStorageService,
          useValue: { getItem: (k: string) => store[k] ?? null },
        },
      ],
    });
    service = TestBed.inject(ServicePointService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'log');
  });

  afterEach(() => httpMock.verify());

  it('getServicePoints should POST providerServiceMapID', () => {
    let res: any;
    service.getServicePoints('13').subscribe((r) => (res = r));
    const req = httpMock.expectOne(environment.servicePointUrl);
    expect(req.request.body).toEqual({ providerServiceMapID: '13' });
    req.flush({ data: [] });
    expect(res).toEqual({ data: [] });
  });

  it('getServicePoints should surface errors', () => {
    let status = 0;
    service.getServicePoints('13').subscribe({ error: (e) => (status = e.status) });
    httpMock
      .expectOne(environment.servicePointUrl)
      .flush('x', { status: 500, statusText: 'Server Error' });
    expect(status).toBe(500);
  });

  it('getMMUDemographics should POST van and provider ids', () => {
    store['serviceLineDetails'] = JSON.stringify({ vanID: 61 });
    store['providerServiceID'] = '13';
    service.getMMUDemographics().subscribe();
    const req = httpMock.expectOne(environment.demographicsCurrentMasterUrl);
    expect(req.request.body).toEqual({ vanID: 61, spPSMID: '13' });
    req.flush({});
  });

  it('getMMUDemographics should send null vanID without serviceLineDetails', () => {
    service.getMMUDemographics().subscribe();
    const req = httpMock.expectOne(environment.demographicsCurrentMasterUrl);
    expect(req.request.body).toEqual({ vanID: null, spPSMID: null });
    req.flush({});
  });

  it('getSwymedMailLogin should GET with userID', () => {
    store['userID'] = '77';
    service.getSwymedMailLogin().subscribe();
    httpMock.expectOne(environment.getSwymedMailLoginUrl + '77').flush({});
  });
});
