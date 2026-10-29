import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { RegistrarService } from './registrar.service';

describe('RegistrarService', () => {
  let service: RegistrarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegistrarService],
    });
    service = TestBed.inject(RegistrarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created with empty subjects', () => {
    expect(service.registrationMasterDetails.value).toBeNull();
    expect(service.beneficiaryDetails.value).toBeNull();
    expect(service.districtMainList.value).toEqual([]);
  });

  describe('pass-through POSTs', () => {
    const p = { a: 1 };
    const cases: [string, () => any, string, any][] = [
      ['getPatientData', () => service.getPatientData(7), environment.getCompleteBeneficiaryDetail, { beneficiaryRegID: 7 }],
      ['registerBeneficiary', () => service.registerBeneficiary(p), environment.registerBeneficiaryUrl, { benD: p }],
      ['quickSearch', () => service.quickSearch(p), environment.quickSearchUrl, p],
      ['identityQuickSearch', () => service.identityQuickSearch(p), environment.identityQuickSearchUrl, p],
      ['advanceSearch', () => service.advanceSearch(p), environment.advanceSearchUrl, p],
      ['advanceSearchIdentity', () => service.advanceSearchIdentity(p), environment.advanceSearchIdentityUrl, p],
      ['externalSearchIdentity', () => service.externalSearchIdentity(p), environment.externalSearchIdentityUrl, p],
      // NOTE: migrateBenToAmrit reuses the external *search* url
      ['migrateBenToAmrit', () => service.migrateBenToAmrit(p), environment.externalSearchIdentityUrl, p],
      ['loadMasterData', () => service.loadMasterData(3), environment.registrarMasterDataUrl, { spID: 3 }],
      ['patientRevisit', () => service.patientRevisit(p), environment.patientRevisitSubmitToNurse, p],
      ['identityPatientRevisit', () => service.identityPatientRevisit(p), environment.identityPatientRevisitSubmitToNurseURL, p],
      ['updatePatientData', () => service.updatePatientData(p), environment.updateBeneficiaryUrl, p],
      ['getDistrictBlocks', () => service.getDistrictBlocks(3), environment.servicePointVillages, { servicePointID: 3 }],
      ['submitBeneficiary', () => service.submitBeneficiary(p), environment.submitBeneficiaryIdentityUrl, p],
      ['updateBeneficiary', () => service.updateBeneficiary(p), environment.updateBeneficiaryIdentityUrl, p],
      ['generateHealthId', () => service.generateHealthId(p), environment.healthIdGenerationUrl, p],
      ['generateHealthIdWithUID', () => service.generateHealthIdWithUID(p), environment.healthIdGenerationWithUIDUrl, p],
      ['verifyOTPForAadharHealthId', () => service.verifyOTPForAadharHealthId(p), environment.verifyOTPUrl, p],
      ['checkAndGenerateMobileOTPHealthId', () => service.checkAndGenerateMobileOTPHealthId(p), environment.checkAndGenerateMobileOTPUrl, p],
      ['verifyMobileOTPForAadhar', () => service.verifyMobileOTPForAadhar(p), environment.verifyMobileOTPUrl, p],
      ['mapHealthId', () => service.mapHealthId(p), environment.mapHealthIdUrl, p],
      ['getHealthIdDetails', () => service.getHealthIdDetails(p), environment.gethealthIdDetailsUrl, p],
      ['generateOtpForMappingCareContext', () => service.generateOtpForMappingCareContext(p), environment.careContextGenerateOtpUrl, p],
      ['verifyOtpForMappingCarecontext', () => service.verifyOtpForMappingCarecontext(p), environment.verifyOtpForMappingContextUrl, p],
      ['generateOTPValidateHealthID', () => service.generateOTPValidateHealthID(p), environment.generateOTPForHealthIDValidation, p],
      ['verifyOTPForHealthIDValidation', () => service.verifyOTPForHealthIDValidation(p), environment.verifyOTPForHealthIDValidation, p],
      ['generateHealthIDCard', () => service.generateHealthIDCard(p), environment.generateOTPForHealthIDCard, p],
      ['confirmAadhar', () => service.confirmAadhar(p), environment.confirmAadharBio, p],
      ['generateABHAForBiometric', () => service.generateABHAForBiometric(p), environment.generateABHAForBio, p],
      ['generateABHAForBiometricMobileOTP', () => service.generateABHAForBiometricMobileOTP(p), environment.generateABHAForBioMobileOTP, p],
      ['verifyOTPForHealthIDCard', () => service.verifyOTPForHealthIDCard(p), environment.verifyOTPAndGenerateHealthCard, p],
      ['updateBenDetailsInMongo', () => service.updateBenDetailsInMongo(p), environment.updateAmritIDInMongo, p],
    ];
    cases.forEach(([name, call, url, body]) => {
      it(`${name} should POST to its endpoint`, () => {
        call().subscribe();
        const req = httpMock.expectOne(url);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(body);
        req.flush({});
      });
    });

    it('should propagate API failures', () => {
      let status = 0;
      service.registerBeneficiary({}).subscribe({ error: (e) => (status = e.status) });
      httpMock
        .expectOne(environment.registerBeneficiaryUrl)
        .flush('x', { status: 500, statusText: 'Server Error' });
      expect(status).toBe(500);
    });
  });

  describe('location GETs', () => {
    it('should append ids to location urls', () => {
      service.getVillageList(1).subscribe();
      service.getSubDistrictList(2).subscribe();
      service.getDistrictList(3).subscribe();
      service.getBiometricData('pid').subscribe();
      httpMock.expectOne(`${environment.getVillageListUrl}1`).flush({});
      httpMock.expectOne(`${environment.getSubDistrictListUrl}2`).flush({});
      httpMock.expectOne(`${environment.getDistrictListUrl}3`).flush({});
      httpMock.expectOne(environment.getdeviceRDServiceUrl + 'pid').flush({});
    });
  });

  describe('generateOTP', () => {
    it('should use the mobile url for MOBILE', () => {
      service.generateOTP({ m: 1 }, 'MOBILE').subscribe();
      httpMock.expectOne(environment.otpGenerationUrl).flush({});
    });

    it('should use the UID url for AADHAR', () => {
      service.generateOTP({ m: 1 }, 'AADHAR').subscribe();
      httpMock.expectOne(environment.otpGenerationWithUIDUrl).flush({});
    });

    it('should throw for an invalid mode', () => {
      expect(() => service.generateOTP({}, 'EMAIL')).toThrowError('Invalid mode');
    });
  });

  describe('getRegistrationMaster', () => {
    it('should emit master data on success', () => {
      service.getRegistrationMaster(3);
      const req = httpMock.expectOne(environment.registrarMasterDataUrl);
      expect(req.request.body).toEqual({ spID: 3 });
      req.flush({ data: { genders: [] } });
      expect(service.registrationMasterDetails.value).toEqual({ genders: [] });
    });

    it('should not emit when response has no data', () => {
      service.getRegistrationMaster(3);
      httpMock.expectOne(environment.registrarMasterDataUrl).flush({ statusCode: 5000 });
      expect(service.registrationMasterDetails.value).toBeNull();
    });
  });

  // NOTE: getPatientDataAsObservable calls res.json(), which does not exist on
  // HttpClient responses, so it always errors and never emits.
  it('getPatientDataAsObservable currently fails on any response', fakeAsync(() => {
    service.getPatientDataAsObservable(7);
    httpMock.expectOne(environment.getCompleteBeneficiaryDetail).flush({ data: { a: 1 } });
    spyOn(console, 'error');
    tick();
    expect(console.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/RXJS-UNHANDLED.*json is not a function/),
    );
    expect(service.beneficiaryDetails.value).toBeNull();
  }));

  describe('state subjects', () => {
    it('edit details save / clear', () => {
      service.saveBeneficiaryEditDataASobservable({ a: 1 });
      expect(service.beneficiaryEditDetails.value).toEqual({ a: 1 });
      service.clearBeneficiaryEditDetails();
      expect(service.beneficiaryEditDetails.value).toBeNull();
    });

    it('health id helpers', () => {
      service.passIDsToFetchOtp('hid');
      expect(service.healthIdOtp.value).toBe('hid');
      service.setHealthIdMobVerification({ v: 1 });
      expect(service.healthIdMobVerification.value).toEqual({ v: 1 });
      service.clearHealthIdMobVerification();
      expect(service.healthIdMobVerification.value).toBeNull();
      service.getabhaDetail({ abha: 1 });
      expect(service.abhaDetailData.value).toEqual({ abha: 1 });
    });

    it('location lists and marital status', () => {
      service.updateDistrictList([{ d: 1 }]);
      service.updateSubDistrictList([{ s: 1 }]);
      expect(service.districtMainList.value).toEqual([{ d: 1 }]);
      expect(service.subDistrictMainList.value).toEqual([{ s: 1 }]);
      service.isMarriageEnable('Married');
      expect(service.isMarriageStatus.value).toBe('Married');
      service.clearMaritalDetails();
      expect(service.isMarriageStatus.value).toBeNull();
    });

    it('changePersonalDetailsData should emit dialog data', () => {
      let latest: any;
      service.dialogResult$.subscribe((v) => (latest = v));
      service.changePersonalDetailsData({ x: 1 });
      expect(latest).toEqual({ x: 1 });
    });
  });
});
