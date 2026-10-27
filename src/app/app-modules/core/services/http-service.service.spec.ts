import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { HttpServiceService } from './http-service.service';

describe('HttpServiceService', () => {
  let service: HttpServiceService;
  let httpMock: HttpTestingController;

  const setup = () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpServiceService],
    });
    service = TestBed.inject(HttpServiceService);
    httpMock = TestBed.inject(HttpTestingController);
  };

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('appLanguage');
  });

  it('should be created with null language when nothing is stored', () => {
    localStorage.removeItem('appLanguage');
    setup();
    expect(service).toBeTruthy();
    expect(service.language).toBeNull();
    expect(service.appCurrentLanguge.value).toBeNull();
  });

  it('should restore the language set from localStorage', () => {
    localStorage.setItem('appLanguage', JSON.stringify({ hello: 'Hello' }));
    setup();
    expect(service.language).toEqual({ hello: 'Hello' });
    let emitted: any;
    service.currentLangugae$.subscribe((v) => (emitted = v));
    expect(emitted).toEqual({ hello: 'Hello' });
  });

  it('should fail construction when stored language is invalid JSON', () => {
    localStorage.setItem('appLanguage', '{not-json');
    expect(setup).toThrow();
  });

  describe('with default setup', () => {
    beforeEach(() => {
      localStorage.removeItem('appLanguage');
      setup();
    });

    it('fetchLanguageSet should GET the language list url', () => {
      const data = [{ languageName: 'English' }];
      service.fetchLanguageSet().subscribe((res) => expect(res).toEqual(data));
      const req = httpMock.expectOne(environment.getLanguageList);
      expect(req.request.method).toBe('GET');
      req.flush(data);
    });

    it('fetchLanguageSet should propagate server errors', () => {
      let error: any;
      service.fetchLanguageSet().subscribe({ error: (e) => (error = e) });
      httpMock
        .expectOne(environment.getLanguageList)
        .flush('fail', { status: 500, statusText: 'Server Error' });
      expect(error.status).toBe(500);
    });

    it('getLanguage should GET the given url', () => {
      service.getLanguage('assets/English.json').subscribe();
      const req = httpMock.expectOne('assets/English.json');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getCurrentLanguage should store, persist and emit the language', () => {
      const emitted: any[] = [];
      service.currentLangugae$.subscribe((v) => emitted.push(v));
      service.getCurrentLanguage({ a: 1 });
      expect(service.language).toEqual({ a: 1 });
      expect(localStorage.getItem('appLanguage')).toBe('{"a":1}');
      expect(emitted).toEqual([null, { a: 1 }]);
    });

    it('filter should push values to listen() subscribers', () => {
      const values: string[] = [];
      service.listen().subscribe((v) => values.push(v));
      service.filter('one');
      service.filter('two');
      expect(values).toEqual(['one', 'two']);
    });
  });
});
