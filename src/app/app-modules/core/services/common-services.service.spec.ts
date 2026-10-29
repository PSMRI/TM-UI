import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { CommonService } from './common-services.service';

describe('CommonService', () => {
  let service: CommonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CommonService],
    });
    service = TestBed.inject(CommonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created with urls from environment', () => {
    expect(service.getStatesURL).toBe(environment.getStatesURL);
    expect(service.getDistrictsURL).toBe(environment.getDistrictsURL);
  });

  it('getStates should GET states url ignoring countryId', () => {
    service.getStates(1).subscribe((r) => expect(r).toEqual([{ id: 1 }]));
    const req = httpMock.expectOne(environment.getStatesURL);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }]);
  });

  it('getDistricts should append stateId to url', () => {
    service.getDistricts(5).subscribe();
    httpMock.expectOne(environment.getDistrictsURL + 5).flush([]);
  });

  it('getDistricts should surface API errors', () => {
    let status = 0;
    service.getDistricts(5).subscribe({ error: (e) => (status = e.status) });
    httpMock
      .expectOne(environment.getDistrictsURL + 5)
      .flush('x', { status: 500, statusText: 'Server Error' });
    expect(status).toBe(500);
  });
});
