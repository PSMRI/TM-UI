import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DoctorService } from './doctor.service';

describe('DoctorService', () => {
  let service: DoctorService;
  let httpMock: HttpTestingController;
  let store: Record<string, any>;
  const fb = new FormBuilder();

  const SESSION = {
    providerServiceID: '13',
    serviceID: '4',
    serviceLineDetails: JSON.stringify({ vanID: 61, parkingPlaceID: 246 }),
    beneficiaryRegID: '1001',
    beneficiaryID: '2002',
    visitID: '3003',
    visitCode: '4004',
    benFlowID: '5005',
    sessionID: '6',
    userName: 'doc1',
    userID: '77',
    doctorFlag: '1',
    nurseFlag: '9',
    pharmacist_flag: '0',
  };

  /** Builds the patientMedicalForm shape used by every doctor save/update */
  const medicalForm = (diagnosis: any = { provisionalDiagnosis: 'x' }) =>
    fb.group({
      patientCaseRecordForm: fb.group({
        generalFindingsForm: fb.group({
          complaints: [
            [
              {
                chiefComplaint: { chiefComplaintID: 1, chiefComplaint: 'Fever' },
                duration: 3,
              },
              { chiefComplaint: null, duration: null },
            ],
          ],
          clinicalObservation: 'obs',
        }),
        generalDoctorInvestigationForm: fb.group({
          labTest: [[{ procedureID: 1 }, { procedureID: 2, disabled: true }]],
          radiologyTest: [[{ procedureID: 3 }]],
          externalInvestigations: 'ext',
        }),
        drugPrescriptionForm: fb.group({
          prescribedDrugs: [
            [{ drugID: 1, createdBy: 'doc1' }, { drugID: 2, createdBy: null }],
          ],
        }),
        generalDiagnosisForm: fb.group(diagnosis),
      }),
      patientReferForm: fb.group({
        referredToInstituteName: [
          { institutionID: 8, institutionName: 'CHC' },
        ],
        refrredToAdditionalServiceList: [
          [{ serviceID: 1 }, { serviceID: 2, disabled: true }],
        ],
        referralReason: 'reason',
        revisitDate: null,
      }),
    });

  const expectPost = (url: string) => {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    req.flush({});
    return req.request.body;
  };

  const expectGet = (url: string) => {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush({});
    return req.request;
  };

  beforeEach(() => {
    store = { ...SESSION };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DoctorService,
        {
          provide: SessionStorageService,
          useValue: { getItem: (k: string) => store[k] ?? null },
        },
      ],
    });
    service = TestBed.inject(DoctorService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'log');
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('worklists', () => {
    const cases: [keyof DoctorService, string][] = [
      ['getDoctorWorklist', environment.doctorWorkList],
      ['getDoctorFutureWorklist', environment.doctorFutureWorkList],
      ['getRadiologistWorklist', environment.radiologistWorklist],
      ['getOncologistWorklist', environment.oncologistWorklist],
    ];
    cases.forEach(([method, base]) => {
      it(`${String(method)} should GET with provider/service/van`, () => {
        (service as any)[method]().subscribe();
        expectGet(base + '13/4/61');
      });

      it(`${String(method)} should throw when serviceLineDetails is missing`, () => {
        delete store['serviceLineDetails'];
        expect(() => (service as any)[method]()).toThrow();
      });
    });

    // NOTE: the URL template literal contains a stray ",\n )}" so the
    // specialist worklist urls are malformed. Tests pin current behaviour.
    it('getSpecialistWorklist should GET specialist url (malformed suffix)', () => {
      service.getSpecialistWorklist().subscribe();
      const req = httpMock.expectOne((r) =>
        r.url.startsWith(environment.specialistWorkListURL + '13/4'),
      );
      expect(req.request.url).toContain(')}');
      req.flush({});
    });

    it('getSpecialistFutureWorklist should GET specialist future url', () => {
      service.getSpecialistFutureWorklist().subscribe();
      httpMock
        .expectOne((r) =>
          r.url.startsWith(environment.specialistFutureWorkListURL + '13/4'),
        )
        .flush({});
    });

    it('should propagate worklist API errors', () => {
      let status = 0;
      service
        .getDoctorWorklist()
        .subscribe({ error: (e: any) => (status = e.status) });
      httpMock
        .expectOne(environment.doctorWorkList + '13/4/61')
        .flush('x', { status: 500, statusText: 'Server Error' });
      expect(status).toBe(500);
    });
  });

  describe('simple pass-through POSTs', () => {
    const payload = { a: 1 };
    const cases: [string, () => any, string, any][] = [
      ['getServiceOnState', () => service.getServiceOnState(), environment.getServiceOnStateUrl, {}],
      ['updateBeneficiaryArrivalStatus', () => service.updateBeneficiaryArrivalStatus(payload), environment.updateBeneficiaryArrivalStatusUrl, payload],
      ['cancelBeneficiaryTCRequest', () => service.cancelBeneficiaryTCRequest(payload), environment.cancelBeneficiaryTCRequestUrl, payload],
      ['confirmStatus', () => service.confirmStatus(9), environment.updateVisitStatus, { benVisitID: 9 }],
      ['getPreviousVisitAnthropometry', () => service.getPreviousVisitAnthropometry(payload), environment.getPreviousAnthropometryUrl, payload],
      ['deleteMedicine', () => service.deleteMedicine(5), environment.drugDeleteUrl, { id: 5 }],
      ['getPreviousSignificiantFindings', () => service.getPreviousSignificiantFindings(payload), environment.getPreviousSignificiantFindingUrl, payload],
      ['getMMUCasesheetData', () => service.getMMUCasesheetData(payload), environment.getMMUCasesheetDataUrl, payload],
      ['getTMCasesheetData', () => service.getTMCasesheetData(payload), environment.getTMCasesheetDataUrl, payload],
      ['getArchivedReports', () => service.getArchivedReports(payload), environment.archivedReportsUrl, payload],
      ['getReportsBase64', () => service.getReportsBase64(payload), environment.ReportsBase64Url, payload],
      ['getPatientMCTSCallHistory', () => service.getPatientMCTSCallHistory(payload), environment.patientMCTSCallHistoryUrl, payload],
      ['getMasterSpecialization', () => service.getMasterSpecialization(), environment.getMasterSpecializationUrl, {}],
      ['getSpecialist', () => service.getSpecialist(payload), environment.getSpecialistUrl, payload],
      ['getAvailableSlot', () => service.getAvailableSlot(payload), environment.getAvailableSlotUrl, payload],
      ['scheduleTC', () => service.scheduleTC(payload), environment.scheduleTCUrl, payload],
      ['beneficiaryTCRequestStatus', () => service.beneficiaryTCRequestStatus(payload), environment.beneficiaryTCRequestStatusUrl, payload],
      ['updateTCStartTime', () => service.updateTCStartTime(payload), environment.updateTCStartTimeUrl, payload],
      ['getMMUData', () => service.getMMUData(payload), environment.loadMMUDataUrl, payload],
      ['getHRPDetails', () => service.getHRPDetails(1, 2), environment.loadHRPUrl, { benRegID: 1, visitCode: 2 }],
    ];
    cases.forEach(([name, call, url, body]) => {
      it(`${name} should POST to its endpoint`, () => {
        call().subscribe();
        expect(expectPost(url)).toEqual(body);
      });
    });
  });

  describe('simple GETs', () => {
    it('getSwymedMail should append the van id', () => {
      service.getSwymedMail().subscribe();
      expectGet(environment.getSwymedMailUrl + '/61');
    });

    it('invokeSwymedCall should use user and specialist ids', () => {
      service.invokeSwymedCall(5).subscribe();
      expectGet(environment.invokeSwymedCallUrl + '77/5');
    });

    it('invokeSwymedCallSpecialist should use user and van ids', () => {
      service.invokeSwymedCallSpecialist().subscribe();
      expectGet(environment.invokeSwymedCallSpecialistUrl + '77/61');
    });

    it('downloadSign should request a blob', () => {
      let result: any;
      service.downloadSign(77).subscribe((r) => (result = r));
      const req = httpMock.expectOne(environment.downloadSignUrl + 77);
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['sig']));
      expect(result).toEqual(jasmine.any(Blob));
    });

    it('getUserId / getAssessment / getAssessmentDet / checkUsersignatureExist', () => {
      service.getUserId('doc1').subscribe();
      service.getAssessment(1).subscribe();
      service.getAssessmentDet(2).subscribe();
      service.checkUsersignatureExist(3).subscribe();
      expectGet(environment.getUserId + 'doc1');
      expectGet(environment.getAssessmentIdUrl + '/1');
      expectGet(environment.getAssessmentUrl + '/2');
      expectGet(environment.checkUsersignExistUrl + 3);
    });
  });

  describe('previous history', () => {
    const cases: [keyof DoctorService, string][] = [
      ['getMMUHistory', environment.previousMMUHistoryUrl],
      ['getTMHistory', environment.previousTMHistoryUrl],
      ['getMCTSHistory', environment.previousMCTSHistoryUrl],
      ['get104History', environment.previous104HistoryUrl],
    ];
    cases.forEach(([method, url]) => {
      it(`${String(method)} should POST beneficiaryRegID from session`, () => {
        (service as any)[method]().subscribe();
        expect(expectPost(url)).toEqual({ beneficiaryRegID: '1001' });
      });
    });
  });

  describe('visit-scoped getters', () => {
    const cases: [keyof DoctorService, string][] = [
      ['getVisitDetails', environment.getCancerScreeningVisitDetails],
      ['getCancerHistoryDetails', environment.getCancerScreeningHistoryDetails],
      ['getCancerVitalsDetails', environment.getCancerScreeningVitalsDetails],
      ['getCancerExaminationDetails', environment.getCancerScreeningExaminationDetails],
      ['getNcdScreeningDetails', environment.getNCDScreeningDetails],
      ['getAncCareDetails', environment.getANCDetailsUrl],
      ['getPNCDetails', environment.getPNCDetailsUrl],
      // NOTE: getCovidDetails currently posts to the PNC url (copy-paste defect)
      ['getCovidDetails', environment.getPNCDetailsUrl],
    ];
    cases.forEach(([method, url]) => {
      it(`${String(method)} should POST ben, visit and visitCode`, () => {
        (service as any)[method]('1', '2').subscribe();
        expect(expectPost(url)).toEqual({
          benRegID: '1',
          benVisitID: '2',
          visitCode: '4004',
        });
      });
    });
  });

  describe('getVisitComplaintDetails', () => {
    const cases: [string, string][] = [
      ['Cancer Screening', environment.getCancerScreeningVisitDetails],
      ['General OPD (QC)', environment.getGeneralOPDQuickConsultVisitDetails],
      ['ANC', environment.getANCVisitDetailsUrl],
      ['General OPD', environment.getGeneralOPDVisitDetailsUrl],
      ['NCD screening', environment.getNCDScreeningVisitDetails],
      ['NCD care', environment.getNCDCareVisitDetailsUrl],
      ['PNC', environment.getPNCVisitDetailsUrl],
      ['COVID-19 Screening', environment.getCovidVisitDetails],
    ];
    cases.forEach(([category, url]) => {
      it(`should use the ${category} endpoint`, () => {
        store['visitCategory'] = category;
        service.getVisitComplaintDetails('1', '2').subscribe();
        expect(expectPost(url)).toEqual({
          benRegID: '1',
          benVisitID: '2',
          visitCode: '4004',
        });
      });
    });

    it('should cache the request until clearCache is called', () => {
      store['visitCategory'] = 'ANC';
      const first = service.getVisitComplaintDetails('1', '2');
      store['visitCategory'] = 'General OPD';
      expect(service.getVisitComplaintDetails('1', '2')).toBe(first);
      service.clearCache();
      service.getVisitComplaintDetails('1', '2').subscribe();
      expectPost(environment.getGeneralOPDVisitDetailsUrl);
    });

    it('should return undefined for an unknown category', () => {
      store['visitCategory'] = 'Unknown';
      expect(service.getVisitComplaintDetails('1', '2')).toBeUndefined();
    });
  });

  describe('getGeneralHistoryDetails', () => {
    const cases: [string, string][] = [
      ['ANC', environment.getANCHistoryDetailsUrl],
      ['General OPD', environment.getGeneralOPDHistoryDetailsUrl],
      ['NCD care', environment.getNCDCareHistoryDetailsUrl],
      ['COVID-19 Screening', environment.getCovidHistoryDetailsUrl],
      ['PNC', environment.getPNCHistoryDetailsUrl],
      ['NCD screening', environment.getNCDScreeningHistoryDetails],
    ];
    cases.forEach(([category, url]) => {
      it(`should use the ${category} endpoint`, () => {
        store['visitCategory'] = category;
        service.getGeneralHistoryDetails('1', '2').subscribe();
        expectPost(url);
      });
    });

    it('should cache and reset with clearCache', () => {
      store['visitCategory'] = 'ANC';
      const first = service.getGeneralHistoryDetails('1', '2');
      expect(service.getGeneralHistoryDetails('1', '2')).toBe(first);
      service.clearCache();
      expect(service.generalHistory).toBeNull();
    });
  });

  describe('getGenericVitals', () => {
    const cases: [string, string][] = [
      ['General OPD (QC)', environment.getGeneralOPDQuickConsultVitalDetails],
      ['ANC', environment.getANCVitalsDetailsUrl],
      ['General OPD', environment.getGeneralOPDVitalDetailsUrl],
      ['NCD care', environment.getNCDCareVitalDetailsUrl],
      ['COVID-19 Screening', environment.getCovidVitalDetailsUrl],
      ['PNC', environment.getPNCVitalsDetailsUrl],
      ['NCD screening', environment.getNCDSceeriningVitalDetails],
    ];
    cases.forEach(([category, url]) => {
      it(`should use the ${category} endpoint and add visitCode`, () => {
        store['visitCategory'] = category;
        service.getGenericVitals({ benRegID: '1' }).subscribe();
        expect(expectPost(url)).toEqual({ benRegID: '1', visitCode: '4004' });
      });
    });

    it('should complete without a request for unknown categories', () => {
      store['visitCategory'] = 'Cancer Screening';
      const complete = jasmine.createSpy('complete');
      service.getGenericVitals({}).subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('getRBSPreviousVitals / getGeneralExamintionData / getIDRSDetails', () => {
    it('getRBSPreviousVitals should POST only for NCD screening', () => {
      store['visitCategory'] = 'NCD screening';
      service.getRBSPreviousVitals({ x: 1 }).subscribe();
      expect(expectPost(environment.getNCDSceeriningVitalDetails)).toEqual({
        x: 1,
      });
      store['visitCategory'] = 'ANC';
      const complete = jasmine.createSpy('complete');
      service.getRBSPreviousVitals({}).subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });

    const exam: [string, string][] = [
      ['ANC', environment.getANCExaminationDataUrl],
      ['General OPD', environment.getGeneralOPDExaminationDetailsUrl],
      ['PNC', environment.getPNCExaminationDataUrl],
    ];
    exam.forEach(([category, url]) => {
      it(`getGeneralExamintionData should use the ${category} endpoint`, () => {
        store['visitCategory'] = category;
        service.getGeneralExamintionData('1', '2').subscribe();
        expectPost(url);
      });
    });

    it('getGeneralExamintionData should complete for other categories', () => {
      store['visitCategory'] = 'NCD care';
      const complete = jasmine.createSpy('complete');
      service.getGeneralExamintionData('1', '2').subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });

    it('getIDRSDetails should POST only for NCD screening', () => {
      store['visitCategory'] = 'NCD screening';
      service.getIDRSDetails('1', '2').subscribe();
      expectPost(environment.getNCDScreeningIDRSDetails);
      store['visitCategory'] = 'ANC';
      const complete = jasmine.createSpy('complete');
      service.getIDRSDetails('1', '2').subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('getCaseRecordAndReferDetails', () => {
    const cases: [string, string][] = [
      ['Cancer Screening', environment.getCancerScreeningDoctorDetails],
      ['General OPD (QC)', environment.getGeneralOPDQuickConsultDoctorDetails],
      ['ANC', environment.getANCDoctorDetails],
      ['General OPD', environment.getGeneralOPDDoctorDetails],
      ['NCD screening', environment.getNCDScreeningDoctorDetails],
      ['NCD care', environment.getNCDCareDoctorDetails],
      ['COVID-19 Screening', environment.getCovidDoctorDetails],
      ['PNC', environment.getPNCDoctorDetails],
    ];
    cases.forEach(([category, url]) => {
      it(`should use the ${category} endpoint with session ids`, () => {
        service.getCaseRecordAndReferDetails('x', 'y', category).subscribe();
        expect(expectPost(url)).toEqual({
          benRegID: '1001',
          benVisitID: '3003',
          visitCode: '4004',
        });
      });
    });

    it('should cache until clearCache', () => {
      const first = service.getCaseRecordAndReferDetails('x', 'y', 'ANC');
      expect(service.getCaseRecordAndReferDetails('x', 'y', 'PNC')).toBe(first);
      service.clearCache();
      expect(service.caseRecordAndReferDetails).toBeNull();
    });
  });

  describe('case record helpers', () => {
    it('postGeneralCaseRecordFindings should drop empty complaints and flatten', () => {
      const form = medicalForm().get(
        'patientCaseRecordForm.generalFindingsForm',
      );
      const result = service.postGeneralCaseRecordFindings(form, { o: 1 });
      expect(result.complaints).toEqual([
        { chiefComplaint: 'Fever', chiefComplaintID: 1, duration: '3' },
      ]);
      expect(result.clinicalObservation).toBe('obs');
      expect(result.o).toBe(1);
    });

    it('postGeneralCaseRecordFindings should null out a missing duration', () => {
      const form = fb.group({
        complaints: [[{ chiefComplaint: { chiefComplaintID: 2, chiefComplaint: 'Cough' }, duration: 0 }]],
      });
      expect(
        service.postGeneralCaseRecordFindings(form, {}).complaints[0].duration,
      ).toBeNull();
    });

    it('postANCCaseRecordDiagnosis should drop a null dateOfDeath', () => {
      const withNull = fb.group({ dateOfDeath: null, a: 1 });
      expect(
        'dateOfDeath' in service.postANCCaseRecordDiagnosis(withNull, {}),
      ).toBeFalse();
      const withDate = fb.group({ dateOfDeath: '2024-01-01' });
      expect(
        service.postANCCaseRecordDiagnosis(withDate, {}).dateOfDeath,
      ).toBe('2024-01-01');
    });

    it('postNCDCareCaseRecordDiagnosis should flatten condition and care type', () => {
      const form = fb.group({
        ncdScreeningCondition: [
          { ncdScreeningConditionID: 3, screeningCondition: 'Diabetes' },
        ],
        ncdCareType: [{ ncdCareTypeID: 4, ncdCareType: 'Referral' }],
      });
      expect(service.postNCDCareCaseRecordDiagnosis(form, { o: 1 })).toEqual({
        ncdScreeningConditionID: 3,
        ncdScreeningCondition: 'Diabetes',
        ncdCareTypeID: 4,
        ncdCareType: 'Referral',
        o: 1,
      });
    });

    it('postNCDCareCaseRecordDiagnosis should leave empty selections untouched', () => {
      const form = fb.group({ ncdScreeningCondition: null, ncdCareType: null });
      const result = service.postNCDCareCaseRecordDiagnosis(form, {});
      expect(result.ncdScreeningConditionID).toBeUndefined();
      expect(result.ncdCareTypeID).toBeUndefined();
    });

    it('postGeneralCaseRecordInvestigation should merge lab and radiology, dropping disabled', () => {
      const form = medicalForm().get(
        'patientCaseRecordForm.generalDoctorInvestigationForm',
      );
      const result = service.postGeneralCaseRecordInvestigation(form, { o: 1 });
      expect(result.laboratoryList).toEqual([
        { procedureID: 1 },
        { procedureID: 3 },
      ]);
      expect(result.labTest).toBeUndefined();
      expect(result.radiologyTest).toBeUndefined();
      expect(result.externalInvestigations).toBe('ext');
    });

    it('postGeneralCaseRecordInvestigation should send no tests when radiology is empty', () => {
      const form = fb.group({ labTest: [[{ procedureID: 1 }]], radiologyTest: null });
      expect(
        service.postGeneralCaseRecordInvestigation(form, {}).laboratoryList,
      ).toEqual([]);
    });

    it('postGeneralCaseRecordPrescription should keep only drugs with createdBy', () => {
      const form = medicalForm().get(
        'patientCaseRecordForm.drugPrescriptionForm',
      );
      expect(service.postGeneralCaseRecordPrescription(form, {})).toEqual([
        { drugID: 1, createdBy: 'doc1' },
      ]);
    });

    it('postGeneralRefer should flatten institute and drop disabled services', () => {
      const form = medicalForm().get('patientReferForm');
      const result = service.postGeneralRefer(form, { o: 1 });
      expect(result.referredToInstituteID).toBe(8);
      expect(result.referredToInstituteName).toBe('CHC');
      expect(result.refrredToAdditionalServiceList).toEqual([{ serviceID: 1 }]);
      expect(result.referralReason).toBe('reason');
      expect(result.o).toBe(1);
    });

    it('postGeneralRefer should keep the revisit date control value', () => {
      const date = new Date(2026, 0, 1);
      const form = fb.group({ revisitDate: [date] });
      expect(service.postGeneralRefer(form, {}).revisitDate).toBe(date);
    });

    const diagnosisDispatch: [string, keyof DoctorService][] = [
      ['ANC', 'postANCCaseRecordDiagnosis'],
      ['General OPD', 'postGeneralOPDCaseRecordDiagnosis'],
      ['NCD care', 'postNCDCareCaseRecordDiagnosis'],
      ['COVID-19 Screening', 'postCovidCaseRecordDiagnosis'],
      ['PNC', 'postANCCaseRecordDiagnosis'],
      ['NCD screening', 'postNCDscreeningCaseRecordDiagnosis'],
    ];
    diagnosisDispatch.forEach(([category, helper]) => {
      it(`postGeneralCaseRecordDiagnosis should use ${String(helper)} for ${category}`, () => {
        const spy = spyOn(service, helper as any).and.returnValue({ ok: 1 });
        expect(
          service.postGeneralCaseRecordDiagnosis({}, category, {}),
        ).toEqual({ ok: 1 });
        expect(spy).toHaveBeenCalled();
      });
    });

    it('postGeneralCaseRecordDiagnosis should return undefined for unknown category', () => {
      expect(
        service.postGeneralCaseRecordDiagnosis({}, 'Other', {}),
      ).toBeUndefined();
    });
  });

  describe('doctor save endpoints', () => {
    const cases: [string, (f: FormGroup) => any, string][] = [
      ['postDoctorGeneralOPDDetails', (f) => service.postDoctorGeneralOPDDetails(f, { o: 1 }, { tc: 1 }, true, false), environment.saveDoctorGeneralOPDDetails],
      ['postDoctorANCDetails', (f) => service.postDoctorANCDetails(f, { o: 1 }, { tc: 1 }, true, false), environment.saveDoctorANCDetails],
      ['postDoctorNCDCareDetails', (f) => service.postDoctorNCDCareDetails(f, { o: 1 }, { tc: 1 }, true, false), environment.saveDoctorNCDCareDetails],
      ['postDoctorPNCDetails', (f) => service.postDoctorPNCDetails(f, { o: 1 }, { tc: 1 }, true, false), environment.savePNCDoctorDetailsUrl],
      ['postDoctorNCDScreeningDetails', (f) => service.postDoctorNCDScreeningDetails(f, { o: 1 }, { tc: 1 }, true, false), environment.saveDoctorNCDScreeningDetails],
      ['postDoctorCovidDetails', (f) => (service as any).postDoctorCovidDetails(f, { o: 1 }, { tc: 1 }, true), environment.saveDoctorCovidDetails],
    ];
    cases.forEach(([name, call, url]) => {
      it(`${name} should POST the composed case record`, () => {
        call(medicalForm()).subscribe();
        const body = expectPost(url);
        expect(body.findings.complaints.length).toBe(1);
        expect(body.investigation.laboratoryList.length).toBe(2);
        expect(body.prescription.length).toBe(1);
        expect(body.refer.referredToInstituteID).toBe(8);
        expect(body.diagnosis.o).toBe(1);
        expect(body).toEqual(
          jasmine.objectContaining({
            vanID: 61,
            parkingPlaceID: 246,
            beneficiaryRegID: '1001',
            providerServiceMapID: '13',
            visitCode: '4004',
            benVisitID: '3003',
            tcRequest: { tc: 1 },
            isSpecialist: true,
          }),
        );
      });
    });

    it('should throw before posting when serviceLineDetails is missing', () => {
      delete store['serviceLineDetails'];
      expect(() =>
        service.postDoctorGeneralOPDDetails(medicalForm(), {}, null, false, false),
      ).toThrow();
    });

    it('should propagate save failures', () => {
      let status = 0;
      service
        .postDoctorGeneralOPDDetails(medicalForm(), {}, null, false, false)
        .subscribe({ error: (e: any) => (status = e.status) });
      httpMock
        .expectOne(environment.saveDoctorGeneralOPDDetails)
        .flush('x', { status: 500, statusText: 'Server Error' });
      expect(status).toBe(500);
    });

    it('postDoctorCancerVisitDetails should merge diagnosis, refer and session details', () => {
      const form = fb.group({
        patientCaseRecordForm: fb.group({ provisionalDiagnosis: 'pd' }),
        patientReferForm: fb.group({ referralReason: 'rr' }),
      });
      service.postDoctorCancerVisitDetails(form, { tc: 1 }, false, true).subscribe();
      const body = expectPost(environment.saveDoctorCancerScreeningDetails);
      expect(body.tcRequest).toEqual({ tc: 1 });
      expect(body.diagnosis).toEqual(
        jasmine.objectContaining({
          provisionalDiagnosis: 'pd',
          referralReason: 'rr',
          beneficiaryRegID: '1001',
          vanID: 61,
          isSpecialist: false,
          doctorSignatureFlag: true,
        }),
      );
    });

    it('postQuickConsultDetails should wrap quickConsultation with session data', () => {
      service
        .postQuickConsultDetails({ quickConsultation: { q: 1 } }, null, false, false)
        .subscribe();
      const body = expectPost(environment.saveDoctorGeneralQuickConsult);
      expect(body.quickConsultation).toEqual(
        jasmine.objectContaining({ q: 1, vanID: 61, visitCode: '4004' }),
      );
    });

    it('updateQuickConsultDetails should POST to the QC update endpoint', () => {
      service
        .updateQuickConsultDetails({ quickConsultation: { q: 1 } }, null, false, false)
        .subscribe();
      expectPost(environment.updateGeneralOPDQuickConsultDoctorDetails);
    });

    it('saveSpecialistCancerObservation should drop referredToInstituteName', () => {
      const form = fb.group({
        patientCaseRecordForm: fb.group({ d: 1 }),
        patientReferForm: fb.group({ referredToInstituteName: 'x', r: 2 }),
      });
      service.saveSpecialistCancerObservation(form, { o: 3 }, true).subscribe();
      const body = expectPost(environment.saveSpecialistCancerObservationUrl);
      expect(body.diagnosis).toEqual({ r: 2, d: 1, o: 3, doctorSignatureFlag: true });
    });

    it('postOncologistRemarksforCancerCaseSheet should send remarks', () => {
      service.postOncologistRemarksforCancerCaseSheet('rem', 2, 1).subscribe();
      expect(expectPost(environment.updateOncologistRemarksCancelUrl)).toEqual({
        beneficiaryRegID: 1,
        benVisitID: 2,
        modifiedBy: 'doc1',
        providerServiceMapID: '13',
        visitCode: '4004',
        provisionalDiagnosisOncologist: 'rem',
      });
    });
  });

  describe('updateDoctorDiagnosisDetails', () => {
    const cases: [string, string][] = [
      ['ANC', environment.updateANCDoctorDetails],
      ['General OPD', environment.updateGeneralOPDDoctorDetails],
      ['NCD care', environment.updateNCDCareDoctorDetails],
      ['PNC', environment.updatePNCDoctorDetails],
      ['COVID-19 Screening', environment.updateCovidDoctorDetails],
      ['NCD screening', environment.updateNCDScreeningDoctorDetails],
    ];
    cases.forEach(([category, url]) => {
      it(`should use the ${category} endpoint`, () => {
        service
          .updateDoctorDiagnosisDetails(medicalForm(), category, { isSpecialist: true }, null, false)
          .subscribe();
        const body = expectPost(url);
        expect(body.isSpecialist).toBeTrue();
        expect(body.diagnosis).toBeDefined();
      });
    });

    it('should complete without a request for unknown categories', () => {
      const complete = jasmine.createSpy('complete');
      service
        .updateDoctorDiagnosisDetails(medicalForm(), 'Cancer Screening', {}, null, false)
        .subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('updateGeneralVitals', () => {
    const cases: [string, string][] = [
      ['ANC', environment.updateANCVitalsDetailsUrl],
      ['General OPD', environment.updateGeneralOPDVitalsDetailsUrl],
      ['NCD care', environment.updateNCDCareVitalsDetailsUrl],
      ['COVID-19 Screening', environment.updateCovidVitalsDetailsUrl],
      ['PNC', environment.updatePNCVitalsDetailsUrl],
      ['NCD screening', environment.updateNCDVitalsDetailsUrl],
    ];
    cases.forEach(([category, url]) => {
      it(`should use the ${category} endpoint`, () => {
        service.updateGeneralVitals(fb.group({ weight: 60 }), category).subscribe();
        expectPost(url);
      });
    });

    it('should include disabled (raw) values and session details', () => {
      const form = fb.group({ weight: 60, bmi: { value: 22, disabled: true } });
      service.updateGeneralVitals(form, 'ANC').subscribe();
      const body = expectPost(environment.updateANCVitalsDetailsUrl);
      expect(body).toEqual(
        jasmine.objectContaining({ weight: 60, bmi: 22, modifiedBy: 'doc1', vanID: 61 }),
      );
    });

    it('should complete for unknown categories', () => {
      const complete = jasmine.createSpy('complete');
      service.updateGeneralVitals(fb.group({}), 'X').subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('updateGeneralHistory', () => {
    const helpers = [
      'updateGeneralPastHistory',
      'updateGeneralComorbidityHistory',
      'updateGeneralMedicationHistory',
      'updateGeneralPastObstetricHistory',
      'updateGeneralMenstrualHistory',
      'updateGeneralFamilyHistory',
      'updateGeneralPersonalHistory',
      'updateGeneralOtherVaccines',
      'updateGeneralImmunizationHistory',
      'updateGeneralDevelopmentHistory',
      'updateGeneralFeedingHistory',
      'updateGeneralPerinatalHistory',
    ];
    beforeEach(() => {
      helpers.forEach((h) =>
        spyOn(service as any, h).and.returnValue({ from: h }),
      );
    });

    const cases: [string, string][] = [
      ['ANC', environment.updateANCHistoryDetailsUrl],
      ['General OPD', environment.updateGeneralOPDHistoryDetailsUrl],
      ['NCD care', environment.updateNCDCareHistoryDetailsUrl],
      ['COVID-19 Screening', environment.updateCovidHistoryDetailsUrl],
      ['PNC', environment.updatePNCHistoryDetailsUrl],
    ];
    it('should complete without a request for unknown categories', () => {
      store['visitCategory'] = 'NCD screening';
      const complete = jasmine.createSpy('complete');
      service.updateGeneralHistory(fb.group({}), {}, 30).subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });

    cases.forEach(([category, url]) => {
      it(`should compose every section and POST for ${category}`, () => {
        store['visitCategory'] = category;
        service.updateGeneralHistory(fb.group({}), {}, 30).subscribe();
        const body = expectPost(url);
        expect(body.pastHistory).toEqual({ from: 'updateGeneralPastHistory' });
        expect(body.vanID).toBe(61);
        // ANC and PNC do not send child-specific sections
        const childSections = ['feedingHistory', 'developmentHistory', 'perinatalHistroy'];
        childSections.forEach((k) =>
          ['ANC', 'PNC'].includes(category)
            ? expect(body[k]).toBeUndefined()
            : expect(body[k]).toBeDefined(),
        );
      });
    });
  });

  describe('history section helpers', () => {
    it('updateGeneralFamilyHistory should flatten disease types', () => {
      const form = fb.group({
        familyDiseaseList: [
          [{ diseaseType: { diseaseTypeID: 4, diseaseType: 'Asthma' } }, { diseaseType: null }],
        ],
      });
      const result = service.updateGeneralFamilyHistory(form, { t: 1 });
      expect(result.familyDiseaseList[0]).toEqual({
        diseaseTypeID: '4',
        diseaseType: 'Asthma',
      });
      expect(result.familyDiseaseList[1].diseaseTypeID).toBeUndefined();
      expect(result.t).toBe(1);
    });

    it('updateGeneralPersonalHistory should flatten tobacco and alcohol', () => {
      const form = fb.group({
        tobaccoList: [[{ tobaccoUseType: { personalHabitTypeID: 1, habitValue: 'Beedi' } }]],
        alcoholList: [
          [{
            typeOfAlcohol: { personalHabitTypeID: 2, habitValue: 'Beer' },
            avgAlcoholConsumption: { habitValue: '1-2' },
          }],
        ],
        allergicList: null,
      });
      const result = service.updateGeneralPersonalHistory(form, {});
      expect(result.tobaccoList[0]).toEqual({ tobaccoUseTypeID: 1, tobaccoUseType: 'Beedi' });
      expect(result.alcoholList[0]).toEqual({
        alcoholTypeID: 2,
        typeOfAlcohol: 'Beer',
        avgAlcoholConsumption: '1-2',
      });
    });

    it('updateGeneralMedicationHistory should merge form value and temp', () => {
      expect(
        service.updateGeneralMedicationHistory(fb.group({ m: 1 }), { t: 2 }),
      ).toEqual({ m: 1, t: 2 });
    });

    it('updatePhyscialActivityHistory should merge form value and details', () => {
      expect(
        service.updatePhyscialActivityHistory(fb.group({ p: 1 }), { t: 2 }),
      ).toEqual({ p: 1, t: 2 });
    });
  });

  describe('updatePatientExamination', () => {
    const helpers = [
      'updateGeneralExaminationForm',
      'updateHeadToToeExaminationForm',
      'updateGastroIntestinalSystemForm',
      'updateCardioVascularSystemForm',
      'updateRespiratorySystemForm',
      'updateCentralNervousSystemForm',
      'updateMusculoSkeletalSystemForm',
      'updateGenitoUrinarySystemForm',
      'updateANCObstetricExamination',
    ];
    // updatePatientExamination takes the form *value*, not a FormGroup
    const examForm = () => ({
      generalExaminationForm: {},
      headToToeExaminationForm: {},
      systemicExaminationForm: {
        gastroIntestinalSystemForm: {},
        cardioVascularSystemForm: {},
        respiratorySystemForm: {},
        centralNervousSystemForm: {},
        musculoSkeletalSystemForm: {},
        genitoUrinarySystemForm: {},
        obstetricExaminationForANCForm: {},
      },
    });

    beforeEach(() => {
      helpers.forEach((h) => spyOn(service as any, h).and.returnValue({ from: h }));
    });

    const cases: [string, string][] = [
      ['ANC', environment.updateANCExaminationDetailsUrl],
      ['PNC', environment.updatePNCExaminationDetailsUrl],
      ['General OPD', environment.updateGeneralOPDExaminationDetailsUrl],
    ];
    cases.forEach(([category, url]) => {
      it(`should POST the composed examination for ${category}`, () => {
        service.updatePatientExamination(examForm(), category, { u: 1 }).subscribe();
        const body = expectPost(url);
        expect(body.generalExamination).toEqual({
          from: 'updateGeneralExaminationForm',
        });
      });
    });

    it('should include obstetric examination only for ANC', () => {
      service.updatePatientExamination(examForm(), 'ANC', { u: 1 }).subscribe();
      expect(
        expectPost(environment.updateANCExaminationDetailsUrl).obstetricExamination,
      ).toEqual({ from: 'updateANCObstetricExamination' });
    });
  });

  describe('IDRS / NCD screening history updates', () => {
    it('updateIDRSDetails should POST wrapped details for NCD screening', () => {
      service.updateIDRSDetails(fb.group({ score: 30 }), 'NCD screening').subscribe();
      const body = expectPost(environment.updateNCDScreeningIDRSDetailsUrl);
      expect(body.idrsDetails).toEqual(
        jasmine.objectContaining({ score: 30, deleted: false, vanID: 61 }),
      );
    });

    it('updateIDRSDetails should complete for other categories', () => {
      const complete = jasmine.createSpy('complete');
      service.updateIDRSDetails(fb.group({}), 'ANC').subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });

    it('updateNCDScreeningHistory should POST only for NCD screening', () => {
      spyOn(service, 'updateGeneralFamilyHistory').and.returnValue({});
      spyOn(service, 'updateGeneralPersonalHistory').and.returnValue({});
      const form = fb.group({
        familyHistory: fb.group({}),
        physicalActivityHistory: fb.group({ a: 1 }),
        personalHistory: fb.group({}),
      });
      store['visitCategory'] = 'NCD screening';
      service.updateNCDScreeningHistory(form, { t: 1 }, 30).subscribe();
      const body = expectPost(environment.updateNCDScreeningHistoryDetailsUrl);
      expect(body.physicalActivityHistory).toEqual({ a: 1, t: 1 });

      store['visitCategory'] = 'ANC';
      const complete = jasmine.createSpy('complete');
      service.updateNCDScreeningHistory(form, {}, 30).subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('cancer updates', () => {
    it('updateCancerVitalsDetails should merge vitals, disabled values and session data', () => {
      service.updateCancerVitalsDetails({ weight: 50 }, { bmi: 20 }).subscribe();
      expect(expectPost(environment.updateCancerScreeningVitals)).toEqual(
        jasmine.objectContaining({ weight: 50, bmi: 20, modifiedBy: 'doc1', vanID: 61 }),
      );
    });

    it('updateCancerHistoryDetails should send only dirty sections', () => {
      const form = fb.group({
        cancerPatientFamilyMedicalHistoryForm: fb.group({
          diseases: [[
            { cancerDiseaseType: { cancerDiseaseType: 'Breast' } },
            { cancerDiseaseType: { cancerDiseaseType: 'Any other Cancer' }, otherDiseaseType: 'Bone' },
          ]],
        }),
        cancerPatientPerosnalHistoryForm: fb.group({ tobacco: 'No' }),
        cancerPatientObstetricHistoryForm: fb.group({ g: 1 }),
      });
      form.get('cancerPatientFamilyMedicalHistoryForm')?.markAsDirty();
      service.updateCancerHistoryDetails(form, { o: 1 }).subscribe();
      const body = expectPost(environment.updateCancerScreeningHistory);
      expect(body.familyHistory.map((d: any) => d.cancerDiseaseType)).toEqual([
        'Breast',
        'Bone',
      ]);
      expect(body.personalHistory).toBeUndefined();
      expect(body.pastObstetricHistory).toBeUndefined();
    });

    it('cancerPersonalHistoryForm / cancerObstetricHistoryForm should merge when dirty', () => {
      const form = fb.group({ x: 1 });
      form.markAsDirty();
      expect(service.cancerPersonalHistoryForm(form, { o: 1 })).toEqual({ x: 1, o: 1 });
      expect(service.cancerObstetricHistoryForm(form, { o: 1 })).toEqual({ x: 1, o: 1 });
    });

    it('cancerFamilyHistoryForm should ignore null diseases', () => {
      const form = fb.group({ diseases: null });
      form.markAsDirty();
      expect(service.cancerFamilyHistoryForm(form, {})).toBeUndefined();
    });

    describe('updateCancerExaminationDetails', () => {
      const examForm = () =>
        fb.group({
          signsForm: fb.group({ lymphNodes: fb.array([fb.group({ node: 'a' })]), s: 1 }),
          oralExaminationForm: fb.group({
            preMalignantLesionTypeList: [['Leukoplakia', 'Any other lesion']],
            otherLesionType: 'Ulcer',
            image: 'img',
          }),
          breastExaminationForm: fb.group({ b: 1, image: 'img' }),
          abdominalExaminationForm: fb.group({ ab: 1 }),
          gynecologicalExaminationForm: fb.group({ g: 1 }),
        });

      it('should send only dirty sections and replace "Any other lesion"', () => {
        const form = examForm();
        form.get('signsForm')?.markAsDirty();
        form.get('oralExaminationForm')?.markAsDirty();
        form.get('breastExaminationForm')?.markAsDirty();
        service.updateCancerExaminationDetails(form, { o: 1 }, []).subscribe();
        const body = expectPost(environment.updateCancerScreeningExamination);
        expect(body.signsDetails.cancerLymphNodeDetails[0]).toEqual({
          node: 'a',
          o: 1,
          createdBy: 'doc1',
        });
        expect(body.oralDetails.preMalignantLesionTypeList).toEqual([
          'Leukoplakia',
          'Ulcer',
        ]);
        expect(body.oralDetails.image).toBeUndefined();
        expect(body.breastDetails.b).toBe(1);
        expect(body.abdominalDetails).toBeUndefined();
        expect(body.gynecologicalDetails).toBeUndefined();
        expect(body.imageCoordinates).toBeUndefined();
      });

      it('should add image coordinates and session ids when provided', () => {
        const form = examForm();
        form.get('abdominalExaminationForm')?.markAsDirty();
        service
          .updateCancerExaminationDetails(form, {}, [{ x: 1 }])
          .subscribe();
        const body = expectPost(environment.updateCancerScreeningExamination);
        expect(body.imageCoordinates).toEqual([{ x: 1 }]);
        expect(body.vanID).toBe(61);
        expect(body.abdominalDetails.ab).toBe(1);
      });

      it('should POST undefined body when nothing is dirty and no images', () => {
        service.updateCancerExaminationDetails(examForm(), {}, []).subscribe();
        expect(expectPost(environment.updateCancerScreeningExamination)).toBeNull();
      });
    });
  });

  describe('state subjects', () => {
    it('setValueToEnableVitalsUpdateButton should emit', () => {
      const values: any[] = [];
      service.enableVitalsUpdateButton$.subscribe((v) => values.push(v));
      service.setValueToEnableVitalsUpdateButton(true);
      expect(values).toEqual([false, true]);
    });

    it('setCapturedHistoryByNurse should emit', () => {
      let latest: any;
      service.populateHistoryResponse$.subscribe((v) => (latest = v));
      service.setCapturedHistoryByNurse({ h: 1 });
      expect(latest).toEqual({ h: 1 });
    });

    it('postNCDscreeningCaseRecordDiagnosis should merge form and details', () => {
      expect(
        service.postNCDscreeningCaseRecordDiagnosis(fb.group({ a: 1 }), { b: 2 }),
      ).toEqual({ a: 1, b: 2 });
    });
  });
});
