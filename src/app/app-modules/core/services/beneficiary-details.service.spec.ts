import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { BeneficiaryDetailsService } from './beneficiary-details.service';

describe('BeneficiaryDetailsService', () => {
  let service: BeneficiaryDetailsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BeneficiaryDetailsService],
    });
    service = TestBed.inject(BeneficiaryDetailsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created with empty state', () => {
    expect(service).toBeTruthy();
    expect(service.beneficiaryDetails.value).toBeNull();
    expect(service.HRPPositiveFlag.value).toBe('');
  });

  describe('getBeneficiaryDetails', () => {
    it('should POST ids and emit returned data', () => {
      service.getBeneficiaryDetails('10', '20');
      const req = httpMock.expectOne(environment.getBeneficiaryDetail);
      expect(req.request.body).toEqual({
        beneficiaryRegID: '10',
        benFlowID: '20',
      });
      req.flush({ data: { beneficiaryName: 'A' } });
      expect(service.beneficiaryDetails.value).toEqual({
        beneficiaryName: 'A',
      });
    });

    it('should not emit when response has no data', () => {
      service.beneficiaryDetails.next({ old: true });
      service.getBeneficiaryDetails('10', '20');
      httpMock
        .expectOne(environment.getBeneficiaryDetail)
        .flush({ statusCode: 5000, errorMessage: 'x' });
      expect(service.beneficiaryDetails.value).toEqual({ old: true });
    });

    it('should emit null on API failure', () => {
      service.beneficiaryDetails.next({ old: true });
      service.getBeneficiaryDetails('10', '20');
      httpMock
        .expectOne(environment.getBeneficiaryDetail)
        .flush('err', { status: 500, statusText: 'Server Error' });
      expect(service.beneficiaryDetails.value).toBeNull();
    });
  });

  it('getBeneficiaryImage should POST beneficiaryRegID', () => {
    service.getBeneficiaryImage('10').subscribe();
    const req = httpMock.expectOne(environment.getBeneficiaryImage);
    expect(req.request.body).toEqual({ beneficiaryRegID: '10' });
    req.flush({});
  });

  it('getCBACDetails should POST benRegID and surface errors', () => {
    let status = 0;
    service.getCBACDetails('10').subscribe({ error: (e) => (status = e.status) });
    const req = httpMock.expectOne(environment.getBenCBACDetails);
    expect(req.request.body).toEqual({ benRegID: '10' });
    req.flush('err', { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
  });

  it('reset should clear beneficiary details', () => {
    service.beneficiaryDetails.next({ a: 1 });
    service.reset();
    expect(service.beneficiaryDetails.value).toBeNull();
  });

  it('setHRPPositive / resetHRPPositive should toggle the flag', () => {
    const values: any[] = [];
    service.HRPPositiveFlag$.subscribe((v) => values.push(v));
    service.setHRPPositive();
    expect(service.HRPPositive).toBe(1);
    service.resetHRPPositive();
    expect(service.HRPPositive).toBe(0);
    expect(values).toEqual(['', 1, 0]);
  });
});
