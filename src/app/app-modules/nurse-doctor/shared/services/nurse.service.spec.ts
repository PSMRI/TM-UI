import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { NurseService } from './nurse.service';
import { SpinnerService } from '../../../core/services/spinner.service';

describe('NurseService', () => {
  let service: NurseService;
  let httpMock: HttpTestingController;
  let store: Record<string, any>;
  const fb = new FormBuilder();

  const SESSION = {
    providerServiceID: '13',
    serviceID: '4',
    serviceLineDetails: JSON.stringify({ vanID: 61, parkingPlaceID: 246 }),
    beneficiaryRegID: '1001',
    beneficiaryID: '2002',
    benFlowID: '5005',
    sessionID: '6',
    userName: 'nurse1',
  };

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
  };

  /** patientVisitForm with every sub-form used by postGenericVisitDetailForm */
  const visitForm = () =>
    fb.group({
      patientVisitDetailsForm: fb.group({ visitReason: 'New Chief Complaint' }),
      patientFileUploadDetailsForm: fb.group({ fileIDs: [[1]] }),
      patientChiefComplaintsForm: fb.group({
        complaints: [
          [{ chiefComplaint: { chiefComplaintID: 7, chiefComplaint: 'Fever' }, duration: 2 }],
        ],
      }),
      patientAdherenceForm: fb.group({ toDrugs: true }),
      patientInvestigationsForm: fb.group({ comments: 'c' }),
      patientCovidForm: fb.group({ symptom: 'none' }),
    });

  beforeEach(() => {
    store = { ...SESSION };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NurseService,
        { provide: SpinnerService, useValue: {} },
        {
          provide: SessionStorageService,
          useValue: { getItem: (k: string) => store[k] ?? null },
        },
      ],
    });
    service = TestBed.inject(NurseService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'log');
  });

  afterEach(() => httpMock.verify());

  it('should be created with default state', () => {
    expect(service).toBeTruthy();
    expect(service.ismmutc.value).toBe('no');
    expect(service.ncdTemp.value).toBeFalse();
  });

  it('filter / contactfilter should notify listeners', () => {
    const values: string[] = [];
    service.listen().subscribe((v) => values.push(v));
    service.filter('a');
    service.contactfilter('b');
    expect(values).toEqual(['a', 'b']);
  });

  describe('worklists', () => {
    const cases: [keyof NurseService, string][] = [
      ['getNurseWorklist', environment.nurseWorklist],
      ['getNurseTMFutureWorklist', environment.getNurseTMFutureWorklistUrl],
      ['getNurseTMWorklist', environment.getNurseTMWorklistUrl],
      ['getMMUNurseWorklist', environment.mmuNurseWorklist],
    ];
    cases.forEach(([method, base]) => {
      it(`${String(method)} should GET with provider/service/van`, () => {
        (service as any)[method]().subscribe();
        expectGet(base + '13/4/61');
      });

      it(`${String(method)} should throw without serviceLineDetails`, () => {
        delete store['serviceLineDetails'];
        expect(() => (service as any)[method]()).toThrow();
      });
    });

    it('should propagate worklist API errors', () => {
      let status = 0;
      service
        .getNurseWorklist()
        .subscribe({ error: (e: any) => (status = e.status) });
      httpMock
        .expectOne(environment.nurseWorklist + '13/4/61')
        .flush('x', { status: 503, statusText: 'Unavailable' });
      expect(status).toBe(503);
    });
  });

  describe('previous history lookups', () => {
    const cases: [keyof NurseService, string][] = [
      ['getPreviousCancerFamilyHistory', environment.previousCancerFamilyHistoryUrl],
      ['getPreviousCancerPersonalHabitHistory', environment.previousCancerPersonalHabitHistoryUrl],
      ['getPreviousCancerPersonalDietHistory', environment.previousCancerPersonalDietHistoryUrl],
      ['getPreviousCancerPastObstetricHistory', environment.previousCancerPastObstetricHistoryUrl],
      ['getPreviousPastHistory', environment.previousPastHistoryUrl],
      ['getPreviousMedicationHistory', environment.previousMedicationHistoryUrl],
      ['getPreviousOtherVaccines', environment.previousOtherVaccineHistoryUrl],
      ['getPreviousTobaccoHistory', environment.previousTobaccoHistoryUrl],
      ['getPreviousAlcoholHistory', environment.previousAlcoholHistoryUrl],
      ['getPreviousAllergyHistory', environment.previousAllergyHistoryUrl],
      ['getPreviousFamilyHistory', environment.previousFamilyHistoryUrl],
      ['getPreviousMenstrualHistory', environment.previousMestrualHistoryUrl],
      ['getPreviousObstetricHistory', environment.previousPastObstetricHistoryUrl],
      ['getPreviousComorbidityHistory', environment.previousComorbidityHistoryUrl],
      ['getPreviousDevelopmentalHistory', environment.previousDevelopmentHistory],
      ['getPreviousPerinatalHistory', environment.previousPerinatalHistory],
      ['getPreviousFeedingHistory', environment.previousFeedingHistory],
      ['getPreviousImmunizationHistory', environment.previousImmunizationHistoryUrl],
      ['getPreviousPhysicalActivityHistory', environment.previousPhyscialactivityHistoryUrl],
      ['getPreviousDiabetesHistory', environment.previousDiabetesHistoryUrl],
      ['getPreviousReferredHistory', environment.previousReferredHistoryUrl],
    ];
    cases.forEach(([method, url]) => {
      it(`${String(method)} should POST benRegID`, () => {
        (service as any)[method]('1001', 'ANC').subscribe();
        expect(expectPost(url)).toEqual({ benRegID: '1001' });
      });
    });

    it('getPreviousVisitData should POST the given object', () => {
      service.getPreviousVisitData({ a: 1 }).subscribe();
      expect(expectPost(environment.previousVisitDataUrl)).toEqual({ a: 1 });
    });

    it('should propagate lookup failures', () => {
      let status = 0;
      service
        .getPreviousPastHistory('1', 'ANC')
        .subscribe({ error: (e: any) => (status = e.status) });
      httpMock
        .expectOne(environment.previousPastHistoryUrl)
        .flush('x', { status: 404, statusText: 'Not Found' });
      expect(status).toBe(404);
    });
  });

  describe('location and misc GETs', () => {
    it('should build location urls', () => {
      service.getNcdScreeningVisitCount(1001).subscribe();
      service.getStateName(1).subscribe();
      service.getDistrictName(2).subscribe();
      service.getSubDistrictName(3).subscribe();
      service.getCountryName().subscribe();
      service.fetchPrescribedFetosenseTests(5005).subscribe();
      expectGet(environment.getNcdScreeningVisitCountUrl + 1001);
      expectGet(environment.getStateName + 1);
      expectGet(environment.getDistrictName + 2);
      expectGet(environment.getSubDistrictName + 3);
      expectGet(environment.getCountryName);
      expectGet(environment.getPrescribedFetosenseTests + 5005);
    });

    // NOTE: getCityName appends countryID twice; test pins current behaviour.
    it('getCityName should GET with the duplicated country id', () => {
      service.getCityName(9).subscribe();
      expectGet(environment.getCityName + '99/');
    });

    it('sendTestDetailsToFetosense / calculateBmiStatus should POST payload', () => {
      service.sendTestDetailsToFetosense({ t: 1 }).subscribe();
      service.calculateBmiStatus({ bmi: 22 }).subscribe();
      expect(expectPost(environment.savefetosenseTestDetailsUrl)).toEqual({ t: 1 });
      expect(expectPost(environment.calculateBmiStatus)).toEqual({ bmi: 22 });
    });
  });

  describe('visit detail builders', () => {
    it('postPatientVisitDetails should merge visit, files and session', () => {
      expect(service.postPatientVisitDetails({ v: 1 }, { f: 2 })).toEqual({
        v: 1,
        f: 2,
        beneficiaryRegID: '1001',
        providerServiceMapID: '13',
        createdBy: 'nurse1',
      });
    });

    it('postCheifComplaintForm should flatten complaints and add ids', () => {
      const result = service.postCheifComplaintForm(
        [
          { chiefComplaint: { chiefComplaintID: 7, chiefComplaint: 'Fever' } },
          { chiefComplaint: null },
        ],
        9,
      );
      expect(result[0]).toEqual(
        jasmine.objectContaining({
          chiefComplaintID: 7,
          chiefComplaint: 'Fever',
          benVisitID: 9,
          createdBy: 'nurse1',
        }),
      );
      expect(result[1].chiefComplaintID).toBeUndefined();
      expect(result[1].beneficiaryRegID).toBe('1001');
    });

    it('postCheifComplaintForm should not mutate the input', () => {
      const input = [{ chiefComplaint: { chiefComplaintID: 1, chiefComplaint: 'A' } }];
      service.postCheifComplaintForm(input, 1);
      expect(input[0].chiefComplaint).toEqual({ chiefComplaintID: 1, chiefComplaint: 'A' });
    });

    (['postAdherenceForm', 'postInvestigationForm', 'postCovidForm'] as const).forEach(
      (method) => {
        it(`${method} should merge form with visit and session ids`, () => {
          expect((service as any)[method]({ x: 1 }, 9)).toEqual({
            x: 1,
            beneficiaryRegID: '1001',
            benVisitID: 9,
            providerServiceMapID: '13',
            createdBy: 'nurse1',
          });
        });
      },
    );

    it('postGenericVitalForm should merge form value', () => {
      expect(service.postGenericVitalForm(fb.group({ weight: 50 }), 9)).toEqual(
        jasmine.objectContaining({ weight: 50, benVisitID: 9 }),
      );
    });

    const visitCases: [string, string[]][] = [
      ['ANC', ['visitDetails', 'chiefComplaints', 'adherence', 'investigation']],
      ['General OPD', ['visitDetails', 'chiefComplaints']],
      ['PNC', ['visitDetails', 'chiefComplaints']],
      ['NCD care', ['visitDetails', 'adherence', 'investigation']],
      ['COVID-19 Screening', ['visitDetails', 'covidDetails']],
      ['NCD screening', ['visitDetails', 'chiefComplaints']],
    ];
    visitCases.forEach(([category, keys]) => {
      it(`postGenericVisitDetailForm should build ${category} sections`, () => {
        const result: any = service.postGenericVisitDetailForm(visitForm(), 9, category);
        expect(Object.keys(result).sort()).toEqual([...keys].sort());
        expect(result.visitDetails.visitReason).toBe('New Chief Complaint');
      });
    });

    it('postGenericVisitDetailForm should return a completing observable for unknown categories', () => {
      const result: any = service.postGenericVisitDetailForm(visitForm(), 9, 'Cancer Screening');
      const complete = jasmine.createSpy('complete');
      result.subscribe({ complete });
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('history builders', () => {
    const generalHelpers = [
      'postGeneralPastHistory',
      'postGeneralComorbidityHistory',
      'postGeneralMedicationHistroy',
      'postGeneralPastObstetricHistory',
      'postGeneralMenstrualHistory',
      'postGeneralFamilyHistory',
      'postGeneralPersonalHistory',
      'postGeneralOtherVaccines',
      'postGeneralImmunizationHistroy',
      'postGeneralDevelopmentHistory',
      'postGeneralFeedingHistory',
      'postGeneralPerinatalHistory',
    ];

    it('postGeneralHistoryForm should call every section with session temp', () => {
      generalHelpers.forEach((h) => spyOn(service as any, h).and.returnValue(h));
      const result: any = service.postGeneralHistoryForm(fb.group({}), {});
      expect(Object.keys(result).length).toBe(12);
      expect(result.pastHistory).toBe('postGeneralPastHistory');
      expect((service as any).postGeneralPastHistory).toHaveBeenCalledWith(
        undefined,
        {
          beneficiaryRegID: '1001',
          benVisitID: null,
          providerServiceMapID: '13',
          createdBy: 'nurse1',
        },
      );
    });

    it('postNCDScreeningHistoryForm should build family, activity and personal', () => {
      spyOn(service, 'postGeneralFamilyHistory').and.returnValue('fam' as any);
      spyOn(service, 'postGeneralPersonalHistory').and.returnValue('per' as any);
      const form = fb.group({ physicalActivityHistory: fb.group({ a: 1 }) });
      const result: any = service.postNCDScreeningHistoryForm(form, {}, 'NCD screening');
      expect(result.familyHistory).toBe('fam');
      expect(result.personalHistory).toBe('per');
      expect(result.physicalActivityHistory).toEqual(
        jasmine.objectContaining({ a: 1, beneficiaryRegID: '1001' }),
      );
    });

    it('postGeneralMedicationHistroy should produce a payload for the form', () => {
      const form = fb.group({ medicationHistoryList: [[]] });
      expect(() => service.postGeneralMedicationHistroy(form, {})).not.toThrow();
    });
  });

  describe('nurse save endpoints', () => {
    const medicalForm = () =>
      fb.group({
        patientVisitForm: visitForm(),
        patientVitalsForm: fb.group({ weight: 50 }),
        patientHistoryForm: fb.group({}),
        patientExaminationForm: fb.group({}),
        patientANCForm: fb.group({}),
        patientPNCForm: fb.group({}),
        idrsScreeningForm: fb.group({ idrsScore: 30 }),
      });

    beforeEach(() => {
      [
        'postGeneralHistoryForm',
        'postANCHistoryForm',
        'postGenericExaminationForm',
        'postANCForm',
        'postPNCDetailForm',
        'postNCDScreeningHistoryForm',
      ].forEach((h) => spyOn(service as any, h).and.returnValue({ from: h }));
    });

    const sessionFields = {
      benFlowID: '5005',
      beneficiaryID: '2002',
      sessionID: '6',
      parkingPlaceID: 246,
      vanID: 61,
      tcRequest: { tc: 1 },
      beneficiaryRegID: '1001',
      providerServiceMapID: '13',
    };

    it('postNurseGeneralOPDVisitForm should POST visit, vitals, history and exam', () => {
      service.postNurseGeneralOPDVisitForm(medicalForm(), 'General OPD', {}, { tc: 1 }).subscribe();
      const body = expectPost(environment.saveNurseGeneralOPDDetails);
      expect(body).toEqual(jasmine.objectContaining(sessionFields));
      expect(body.visitDetails.chiefComplaints[0].chiefComplaint).toBe('Fever');
      expect(body.vitalDetails.weight).toBe(50);
      expect(body.historyDetails).toEqual({ from: 'postGeneralHistoryForm' });
      expect(body.examinationDetails).toEqual({ from: 'postGenericExaminationForm' });
    });

    it('postNurseANCVisitForm should include ANC details and ANC history', () => {
      service.postNurseANCVisitForm(medicalForm(), null, 'ANC', 25, { tc: 1 }).subscribe();
      const body = expectPost(environment.saveNurseANCDetails);
      expect(body.ancDetails).toEqual({ from: 'postANCForm' });
      expect(body.historyDetails).toEqual({ from: 'postANCHistoryForm' });
      expect(body.visitDetails.adherence).toBeDefined();
    });

    it('postNurseNCDCareVisitForm should POST to NCD care endpoint', () => {
      service.postNurseNCDCareVisitForm(medicalForm(), 'NCD care', {}, { tc: 1 }).subscribe();
      const body = expectPost(environment.saveNurseNCDCareDetails);
      expect(body).toEqual(jasmine.objectContaining(sessionFields));
      expect(body.visitDetails.investigation.comments).toBe('c');
    });

    it('postNurseCovidVisitForm should POST covid details', () => {
      service.postNurseCovidVisitForm(medicalForm(), 'COVID-19 Screening', {}, { tc: 1 }).subscribe();
      const body = expectPost(environment.saveNurseCovidDetails);
      expect(body.visitDetails.covidDetails.symptom).toBe('none');
    });

    it('postNursePNCVisitForm should include PNC details', () => {
      service.postNursePNCVisitForm(medicalForm(), 'PNC', {}, { tc: 1 }).subscribe();
      const body = expectPost(environment.savePNCNurseDetailsUrl);
      expect(body.pNCDeatils).toEqual({ from: 'postPNCDetailForm' });
    });

    it('postNCDScreeningForm should include IDRS and NCD history', () => {
      service.postNCDScreeningForm(medicalForm(), 'NCD screening', {}, { tc: 1 }).subscribe();
      const body = expectPost(environment.postNCDScreeningDetails);
      expect(body.historyDetails).toEqual({ from: 'postNCDScreeningHistoryForm' });
      expect(JSON.stringify(body)).toContain('"idrsScore":30');
    });

    it('postNurseGeneralQCVisitForm should merge visit, files and vitals', () => {
      service.postNurseGeneralQCVisitForm(medicalForm(), { tc: 1 }).subscribe();
      const body = expectPost(environment.saveNurseGeneralQuickConsult);
      expect(body.visitDetails).toEqual(
        jasmine.objectContaining({ visitReason: 'New Chief Complaint', fileIDs: [1] }),
      );
      expect(body.vitalsDetails.weight).toBe(50);
    });

    it('should throw before posting when serviceLineDetails is missing', () => {
      delete store['serviceLineDetails'];
      expect(() =>
        service.postNurseGeneralOPDVisitForm(medicalForm(), 'General OPD', {}, null),
      ).toThrow();
    });

    it('should propagate save failures', () => {
      let status = 0;
      service
        .postNurseGeneralOPDVisitForm(medicalForm(), 'General OPD', {}, null)
        .subscribe({ error: (e: any) => (status = e.status) });
      httpMock
        .expectOne(environment.saveNurseGeneralOPDDetails)
        .flush('x', { status: 500, statusText: 'Server Error' });
      expect(status).toBe(500);
    });

    describe('postNurseCancerVisitForm', () => {
      beforeEach(() => {
        spyOn(service, 'postCancerExaminationDetails').and.returnValue({ exam: 1 } as any);
        spyOn(service, 'postCancerHistoryDetails').and.returnValue({ hist: 1 } as any);
      });

      it('should send only dirty sections', () => {
        const form = medicalForm();
        form.get('patientVitalsForm')?.markAsDirty();
        form.get('patientHistoryForm')?.markAsDirty();
        service.postNurseCancerVisitForm(form, [], true, null).subscribe();
        const body = expectPost(environment.saveNurseCancerScreeningDetails);
        expect(body.visitDetails).toBeUndefined();
        expect(body.vitalsDetails.weight).toBe(50);
        expect(body.historyDetails).toEqual({ hist: 1 });
        expect(body.examinationDetails).toBeUndefined();
        expect(body.sendToDoctorWorklist).toBeTrue();
      });

      it('should include visit and examination when dirty', () => {
        const form = medicalForm();
        form.get('patientVisitForm.patientVisitDetailsForm')?.markAsDirty();
        form.get('patientExaminationForm')?.markAsDirty();
        service.postNurseCancerVisitForm(form, [{ x: 1 }], false, null).subscribe();
        const body = expectPost(environment.saveNurseCancerScreeningDetails);
        expect(body.visitDetails.visitReason).toBe('New Chief Complaint');
        expect(body.examinationDetails).toEqual({ exam: 1 });
        expect(service.postCancerExaminationDetails).toHaveBeenCalledWith(
          jasmine.anything(),
          jasmine.any(Object),
          [{ x: 1 }],
        );
      });
    });
  });

  describe('saveBenCovidVaccinationDetails', () => {
    it('should send an update when covidVSID exists', () => {
      const form = fb.group({ covidVSID: 3, vaccineStatus: 'Yes', vaccineTypes: 1, doseTaken: 2 });
      service.saveBenCovidVaccinationDetails(form).subscribe();
      expect(expectPost(environment.saveCovidVaccinationDetailsUrl)).toEqual(
        jasmine.objectContaining({
          covidVSID: 3,
          covidVaccineTypeID: 1,
          doseTypeID: 2,
          modifiedBy: 'nurse1',
          vanID: 61,
        }),
      );
    });

    it('should send a create (null id, no modifiedBy) for new records', () => {
      const form = fb.group({ covidVSID: null, vaccineStatus: 'No', vaccineTypes: null, doseTaken: null });
      service.saveBenCovidVaccinationDetails(form).subscribe();
      const body = expectPost(environment.saveCovidVaccinationDetailsUrl);
      expect(body.covidVSID).toBeNull();
      expect(body.modifiedBy).toBeUndefined();
    });
  });

  describe('state setters', () => {
    it('setNCDTemp / clearNCDTemp', () => {
      service.setNCDTemp(true);
      expect(service.ncdTemp.value).toBeTrue();
      service.clearNCDTemp();
      expect(service.ncdTemp.value).toBeFalse();
    });

    it('setIsMMUTC should emit', () => {
      service.setIsMMUTC('yes');
      expect(service.ismmutc.value).toBe('yes');
    });

    it('LMP for fetosense set/clear', () => {
      service.setLMPForFetosenseTest('2026-01-01');
      expect(service.lmpFetosenseTestValue.value).toBe('2026-01-01');
      service.clearLMPForFetosenseTest();
      expect(service.lmpFetosenseTest).toBeNull();
    });

    it('RBS investigation and vitals set/clear', () => {
      service.setRbsSelectedInInvestigation(true);
      expect(service.rbsSelectedInInvestigation.value).toBeTrue();
      service.clearRbsSelectedInInvestigation();
      expect(service.rbsSelectedInInvestigation.value).toBeFalse();
      service.setRbsInCurrentVitals(120);
      expect(service.rbsTestResultCurrent.value).toBe(120);
      service.clearRbsInVitals();
      expect(service.rbsTestResultCurrent.value).toBeNull();
    });

    it('enableLAssessment and NCD provision set/clear', () => {
      service.setEnableLAssessment(true);
      expect(service.enableLAssessment.value).toBeTrue();
      service.clearEnableLAssessment();
      expect(service.enableLAssessment.value).toBeFalse();
      service.setNCDScreeningProvision(true);
      expect(service.enableProvisionalDiag.value).toBeTrue();
      service.clearNCDScreeningProvision();
      expect(service.enableProvisionalDiag.value).toBeFalse();
    });
  });
});
