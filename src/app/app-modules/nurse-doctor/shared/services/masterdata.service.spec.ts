import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { MasterdataService } from './masterdata.service';

describe('MasterdataService', () => {
  let service: MasterdataService;
  let httpMock: HttpTestingController;
  let store: Record<string, any>;

  beforeEach(() => {
    store = { beneficiaryGender: 'Female' };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MasterdataService,
        {
          provide: SessionStorageService,
          useValue: { getItem: (k: string) => store[k] ?? null },
        },
      ],
    });
    service = TestBed.inject(MasterdataService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'log');
  });

  afterEach(() => httpMock.verify());

  it('should be created with empty master data', () => {
    expect(service.visitDetailMasterDataSource.value).toBeNull();
    expect(service.nurseMasterDataSource.value).toBeNull();
    expect(service.doctorMasterDataSource.value).toBeNull();
  });

  it('filter / contactfilter should notify listeners', () => {
    const values: string[] = [];
    service.listen().subscribe((v) => values.push(v));
    service.filter('a');
    service.contactfilter('b');
    expect(values).toEqual(['a', 'b']);
  });

  describe('getVisitDetailMasterData', () => {
    it('should emit the data on success', () => {
      service.getVisitDetailMasterData();
      httpMock
        .expectOne(environment.visitDetailMasterDataUrl)
        .flush({ data: { visitCategories: [] } });
      expect(service.visitDetailMasterDataSource.value).toEqual({
        visitCategories: [],
      });
    });

    // NOTE: the subscription has no error handler, so failures surface as
    // unhandled RxJS errors and the previous data is kept.
    it('should keep previous data and leave the error unhandled on API failure', fakeAsync(() => {
      service.visitDetailMasterDataSource.next({ old: true });
      service.getVisitDetailMasterData();
      httpMock
        .expectOne(environment.visitDetailMasterDataUrl)
        .flush('x', { status: 500, statusText: 'Server Error' });
      spyOn(console, 'error');
      tick();
      expect(console.error).toHaveBeenCalledWith(
        jasmine.stringMatching('RXJS-UNHANDLED'),
      );
      expect(service.visitDetailMasterDataSource.value).toEqual({ old: true });
    }));
  });

  it('getNurseMasterData should include visit, provider and gender in url', () => {
    service.getNurseMasterData('2', 13);
    httpMock
      .expectOne(environment.nurseMasterDataUrl + '2/13/Female')
      .flush({ data: { nurse: 1 } });
    expect(service.nurseMasterDataSource.value).toEqual({ nurse: 1 });
  });

  describe('getDoctorMasterData', () => {
    it('should include facility and van ids', () => {
      store['serviceLineDetails'] = JSON.stringify({ facilityID: 5, vanID: 9 });
      service.getDoctorMasterData('2', 13);
      httpMock
        .expectOne(environment.doctorMasterDataUrl + '2/13/Female/5/9')
        .flush({ data: { doc: 1 } });
      expect(service.doctorMasterDataSource.value).toEqual({ doc: 1 });
    });

    it('should default missing facility and van ids to 0', () => {
      store['serviceLineDetails'] = JSON.stringify({
        facilityID: null,
      });
      service.getDoctorMasterData('2', 13);
      httpMock
        .expectOne(environment.doctorMasterDataUrl + '2/13/Female/0/0')
        .flush({ data: {} });
    });

    it('should throw when serviceLineDetails is missing', () => {
      expect(() => service.getDoctorMasterData('2', 13)).toThrow();
      httpMock.expectNone(() => true);
    });
  });

  it('getSnomedCTRecord should POST the term', () => {
    service.getSnomedCTRecord('fever').subscribe();
    const req = httpMock.expectOne(environment.snomedCTRecordURL);
    expect(req.request.body).toEqual({ term: 'fever' });
    req.flush({});
  });

  it('reset should clear all master data', () => {
    service.visitDetailMasterDataSource.next(1);
    service.nurseMasterDataSource.next(1);
    service.doctorMasterDataSource.next(1);
    service.reset();
    expect(service.visitDetailMasterDataSource.value).toBeNull();
    expect(service.nurseMasterDataSource.value).toBeNull();
    expect(service.doctorMasterDataSource.value).toBeNull();
  });

  it('getJSON should GET the given url', () => {
    service.getJSON('assets/x.json').subscribe();
    httpMock.expectOne('assets/x.json').flush({});
  });

  it('searchDiagnosisBasedOnPageNo / 1 should POST term and page', () => {
    service.searchDiagnosisBasedOnPageNo('fev', 0).subscribe();
    service.searchDiagnosisBasedOnPageNo1('cou', 2).subscribe();
    expect(
      httpMock.expectOne(environment.snomedCTRecordListURL).request.body,
    ).toEqual({ term: 'fev', pageNo: 0 });
    expect(
      httpMock.expectOne(environment.snomedCTRecordListURL1).request.body,
    ).toEqual({ term: 'cou', pageNo: 2 });
  });

  it('fetchCalibrationStrips should POST provider and page', () => {
    service.fetchCalibrationStrips(13, 1).subscribe();
    const req = httpMock.expectOne(environment.getCalibrationStrips);
    expect(req.request.body).toEqual({ providerServiceMapID: 13, pageNo: 1 });
    req.flush({});
  });

  it('getVaccinationTypeAndDoseMaster should GET and surface errors', () => {
    let status = 0;
    service
      .getVaccinationTypeAndDoseMaster()
      .subscribe({ error: (e) => (status = e.status) });
    httpMock
      .expectOne(environment.vaccinationTypeAndDoseMasterUrl)
      .flush('x', { status: 503, statusText: 'Unavailable' });
    expect(status).toBe(503);
  });

  it('getPreviousCovidVaccinationDetails should POST beneficiaryRegID', () => {
    service.getPreviousCovidVaccinationDetails(77).subscribe();
    const req = httpMock.expectOne(environment.previousCovidVaccinationUrl);
    expect(req.request.body).toEqual({ beneficiaryRegID: 77 });
    req.flush({});
  });
});
