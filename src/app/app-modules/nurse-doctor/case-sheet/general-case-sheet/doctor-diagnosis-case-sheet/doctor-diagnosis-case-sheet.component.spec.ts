/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DoctorDiagnosisCaseSheetComponent } from './doctor-diagnosis-case-sheet.component';
import { DoctorService } from '../../../shared/services/doctor.service';
import { NurseService } from '../../../shared/services/nurse.service';
import { MasterdataService } from '../../../shared/services/masterdata.service';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('DoctorDiagnosisCaseSheetComponent', () => {
  let component: DoctorDiagnosisCaseSheetComponent;
  let fixture: ComponentFixture<DoctorDiagnosisCaseSheetComponent>;
  let doctorService: any;
  let nurseService: any;
  let registrar: any;
  let master: any;
  let confirmation: any;

  const caseSheet = (overrides: any = {}) => ({
    BeneficiaryData: { ageVal: 8, ...(overrides.ben || {}) },
    nurseData: {
      vitals: {
        benAnthropometryDetail: { height_cm: 150 },
        benPhysicalVitalDetail: { pulseRate: 72, ...(overrides.vitals || {}) },
      },
      ...(overrides.nurse || {}),
    },
    doctorData: {
      diagnosis: { createdBy: 'doc', ...(overrides.diagnosis || {}) },
      LabReport: [{ procedureName: 'CBC' }],
      ...(overrides.doctor || {}),
    },
  });

  async function setup(session: Record<string, any> = {}) {
    doctorService = autoSpy(DoctorService);
    nurseService = autoSpy(NurseService);
    registrar = autoSpy(RegistrarService);
    master = autoSpy(MasterdataService);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DoctorDiagnosisCaseSheetComponent],
      providers: [
        ...commonTestProviders({
          session: {
            caseSheetVisitCategory: 'General OPD',
            caseSheetBeneficiaryRegID: 55,
            visitCode: 66,
            ...session,
          },
        }),
        { provide: DoctorService, useValue: doctorService },
        { provide: NurseService, useValue: nurseService },
        { provide: RegistrarService, useValue: registrar },
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(DoctorDiagnosisCaseSheetComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    spyOn(console, 'error');
    confirmation = TestBed.inject(ConfirmationService);
    fixture = TestBed.createComponent(DoctorDiagnosisCaseSheetComponent);
    component = fixture.componentInstance;
  }

  describe('ngOnInit', () => {
    beforeEach(() => setup());

    it('reads the visit category and loads HRP, ABHA and assessment data', () => {
      fixture.detectChanges();
      expect(component.visitCategory).toBe('General OPD');
      expect(doctorService.getHRPDetails).toHaveBeenCalledWith(55, 66);
      expect(registrar.getHealthIdDetails).toHaveBeenCalledWith({
        beneficiaryRegID: 55,
        beneficiaryID: null,
      });
      expect(doctorService.getAssessment).toHaveBeenCalledWith(55);
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      component.current_language_set = undefined;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('flags high-risk pregnancies', () => {
      doctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } }),
      );
      component.fetchHRPPositive();
      expect(component.showHRP).toBe('true');
      doctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } }),
      );
      component.fetchHRPPositive();
      expect(component.showHRP).toBe('false');
    });
  });

  describe('getHealthIDDetails', () => {
    beforeEach(async () => {
      await setup();
      component.current_language_set = LANGUAGE_EN;
    });

    it('joins all health IDs', () => {
      registrar.getHealthIdDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            BenHealthDetails: [
              { healthId: 'a@abdm' },
              { healthId: null },
              { healthId: 'b@abdm' },
            ],
          },
        }),
      );
      component.getHealthIDDetails();
      expect(component.healthIDValue).toBe('a@abdm,b@abdm');
    });

    it('alerts on failure and error', () => {
      registrar.getHealthIdDetails.and.returnValue(of({ statusCode: 5000 }));
      component.getHealthIDDetails();
      registrar.getHealthIdDetails.and.returnValue(throwingObs());
      component.getHealthIDDetails();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
    });
  });

  describe('assessment', () => {
    beforeEach(() => setup());

    it('loads details for the latest assessment', () => {
      doctorService.getAssessment.and.returnValue(
        of({ statusCode: 200, data: [{ assessmentId: 1 }, { assessmentId: 2 }] }),
      );
      doctorService.getAssessmentDet.and.returnValue(
        of({
          statusCode: 200,
          data: {
            severity: 'Mild',
            cough_pattern: 'Dry',
            cough_severity_score: 3,
            record_duration: 10,
          },
        }),
      );
      component.getAssessmentID();
      expect(doctorService.getAssessmentDet).toHaveBeenCalledWith(2);
      expect(component.severity).toBe('Mild');
      expect(component.cough_pattern).toBe('Dry');
      expect(component.cough_severity_score).toBe(3);
      expect(component.record_duration).toBe(10);
      expect(nurseService.setEnableLAssessment).toHaveBeenCalledWith(false);
      expect(component.enableResult).toBeTrue();
    });

    it('skips details when there is no assessment', () => {
      doctorService.getAssessment.and.returnValue(
        of({ statusCode: 200, data: [] }),
      );
      component.getAssessmentID();
      expect(doctorService.getAssessmentDet).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => setup());

    it('does nothing without case sheet data', () => {
      component.ngOnChanges();
      expect(component.beneficiaryDetails).toBeUndefined();
      expect(component.ncdScreeningCondition).toBeNull();
    });

    it('maps vitals, case records and today', () => {
      const t = new Date();
      component.casesheetData = caseSheet({
        diagnosis: { doctorDiagnonsis: 'Fever', ncdScreeningCondition: 'A||B' },
      });
      component.ngOnChanges();
      expect(component.userName).toBe('doc');
      expect(component.doctorDiagnosis).toBe('Fever');
      expect(component.diagnosisFlag).toBeTrue();
      expect(component.date).toBe(
        `${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()}`,
      );
      expect(component.currentVitals).toEqual({
        height_cm: 150,
        pulseRate: 72,
      });
      expect(component.caseRecords).toBe(component.casesheetData.doctorData);
      expect(component.ncdScreeningCondition).toBe('A,B');
    });

    it('formats service and consultation dates', () => {
      component.casesheetData = caseSheet({
        ben: {
          serviceDate: '2026-03-05T09:07:03',
          consultationDate: '2026-11-15T14:30:45',
        },
      });
      component.ngOnChanges();
      expect(component.beneficiaryDetails.serviceDate).toBe(
        '05/03/2026 09:07:03',
      );
      expect(component.beneficiaryDetails.consultationDate).toBe(
        '15/11/2026 14:30:45',
      );
    });

    it('maps COVID details', () => {
      component.casesheetData = caseSheet({
        nurse: {
          covidDetails: {
            symptom: ['Fever'],
            contactStatus: [],
            travelStatus: true,
            suspectedStatusUI: 'NO',
            recommendation: [['R1', 'R2']],
          },
        },
      });
      component.ngOnChanges();
      expect(component.symptomsList).toEqual(['Fever']);
      expect(component.symptomFlag).toBeTrue();
      expect(component.contactFlag).toBeFalse();
      expect(component.travelStatus).toBe('Yes');
      expect(component.travelFlag).toBeTrue();
      expect(component.suspected).toBe('NO');
      expect(component.recommendationText).toBe('R1\nR2');
    });

    it('maps a negative travel status and contacts', () => {
      component.casesheetData = caseSheet({
        nurse: { covidDetails: { contactStatus: ['x'], travelStatus: false } },
      });
      component.ngOnChanges();
      expect(component.contactFlag).toBeTrue();
      expect(component.travelStatus).toBe('No');
    });

    it('prepends the vitals RBS result to the lab report', () => {
      component.casesheetData = caseSheet({
        vitals: { rbsTestResult: 140, rbsTestRemarks: 'ok' },
      });
      component.ngOnChanges();
      const lab = component.caseRecords.LabReport;
      expect(lab.length).toBe(2);
      expect(lab[0].procedureName).toBe('RBS Test');
      expect(lab[0].componentList[0]).toEqual(
        jasmine.objectContaining({ testResultValue: 140, remarks: 'ok' }),
      );
    });

    it('cleans empty "other" pregnancy complications', () => {
      component.casesheetData = caseSheet({
        diagnosis: {
          complicationOfCurrentPregnancy:
            'Anemia, Other-complications : null',
        },
        nurse: { anc: { a: 1 } },
      });
      component.ngOnChanges();
      expect(component.tempComplication).toBeTrue();
      expect(component.newComp).toBe('Anemia');
      expect(component.ancDetails).toEqual({ a: 1 });
    });

    it('keeps complications without an empty "other"', () => {
      component.casesheetData = caseSheet({
        diagnosis: { complicationOfCurrentPregnancy: 'Anemia' },
      });
      component.ngOnChanges();
      expect(component.tempComplication).toBeFalse();
    });

    it('maps IDRS answers and diseases', () => {
      const IDRSDetail = {
        idrsDetails: [
          { idrsQuestionId: 1, answer: 'yes' },
          { idrsQuestionId: 1, answer: 'yes' },
          { idrsQuestionId: 2, answer: 'no' },
        ],
        suspectedDisease: 'Diabetes,Hypertension',
        confirmedDisease: 'Diabetes',
      };
      component.casesheetData = caseSheet({ nurse: { idrs: { IDRSDetail } } });
      component.ngOnChanges();
      expect(component.temp1).toEqual([{ idrsQuestionId: 1, answer: 'yes' }]);
      expect(component.idrsScore).toBe(IDRSDetail);
      expect(component.suspect).toEqual(['Diabetes', 'Hypertension']);
      expect(component.suspectt).toEqual(['Diabetes']);
    });

    it('formats the revisit date and downloads the signature when flagged', () => {
      spyOn(component, 'downloadSign');
      component.casesheetData = caseSheet({
        ben: { doctorSignatureFlag: true },
        doctor: { Refer: { revisitDate: '2026-03-05T12:00:00' } },
      });
      component.ngOnChanges();
      expect(component.casesheetData.doctorData.Refer.revisitDate).toBe(
        '05/03/2026',
      );
      expect(component.downloadSign).toHaveBeenCalled();
    });

    it('loads COVID vaccination details for beneficiaries aged 12+', () => {
      spyOn(component, 'getPreviousCovidVaccinationDetails');
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({ statusCode: 200, data: { doseType: [1], vaccineType: [2] } }),
      );
      component.casesheetData = caseSheet({ ben: { ageVal: 30 } });
      component.ngOnChanges();
      expect(component.getPreviousCovidVaccinationDetails).toHaveBeenCalledWith(
        [1],
        [2],
      );
    });
  });

  describe('General OPD (QC)', () => {
    beforeEach(() =>
      setup({ caseSheetVisitCategory: 'General OPD (QC)' }).then(() =>
        fixture.detectChanges(),
      ),
    );

    it('builds case records and referral lists from QC data', () => {
      component.casesheetData = caseSheet({
        diagnosis: {
          diagnosisProvided: 'Dx',
          instruction: 'Rest',
          externalInvestigation: 'X-ray',
        },
        doctor: {
          findings: { f: 1 },
          prescription: [{ drug: 'A' }],
          Refer: {
            refrredToAdditionalServiceList: [
              { serviceName: 'ICTC' },
              { serviceName: '' },
              { serviceName: 'Lab' },
            ],
            referralReason: ['Pain', null, 'Fever'],
          },
        },
      });
      component.ngOnChanges();
      expect(component.caseRecords.diagnosis).toEqual({
        provisionalDiagnosis: 'Dx',
        specialistAdvice: 'Rest',
        externalInvestigation: 'X-ray',
      });
      expect(component.caseRecords.findings).toEqual({ f: 1 });
      expect(component.serviceList).toBe('ICTC,Lab');
      expect(component.referralReasonList).toBe('Pain,Fever');
    });
  });

  describe('signature', () => {
    beforeEach(() => setup());

    it('downloads the signature of the TC specialist when present', () => {
      spyOn(component, 'showSign');
      doctorService.getUserId.and.returnValue(of({ userId: 9 }));
      component.beneficiaryDetails = { tCSpecialistUserID: 77 };
      component.downloadSign();
      expect(doctorService.downloadSign).toHaveBeenCalledWith(77);
      expect(component.showSign).toHaveBeenCalledWith(jasmine.any(Blob));
    });

    it('falls back to the case sheet author and logs errors', () => {
      component.userName = 'doc';
      doctorService.getUserId.and.returnValue(of({ userId: 9 }));
      doctorService.downloadSign.and.returnValue(throwingObs());
      component.downloadSign();
      expect(doctorService.getUserId).toHaveBeenCalledWith('doc');
      expect(doctorService.downloadSign).toHaveBeenCalledWith(9);
      expect(console.error).toHaveBeenCalled();
    });

    it('showSign reads the blob into a data URL', (done) => {
      component.showSign(new Blob(['sig'], { type: 'text/plain' }));
      setTimeout(() => {
        expect(component.imgUrl).toContain('data:text/plain;base64,');
        done();
      }, 50);
    });
  });

  describe('covid vaccination', () => {
    beforeEach(() => setup());

    it('resolves dose and vaccine names', () => {
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { covidVSID: 1, doseTypeID: 2, covidVaccineTypeID: 3 },
        }),
      );
      const doses = [{ covidDoseTypeID: 2 }];
      const vaccines = [{ covidVaccineTypeID: 3 }, { covidVaccineTypeID: 4 }];
      component.getPreviousCovidVaccinationDetails(doses, vaccines);
      expect(master.getPreviousCovidVaccinationDetails).toHaveBeenCalledWith(55);
      expect(component.covidVaccineDetails.doseTypeID).toEqual(doses);
      expect(component.covidVaccineDetails.covidVaccineTypeID).toEqual([
        vaccines[0],
      ]);
    });

    it('logs lookup errors', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        throwingObs({ errorMessage: 'm' }),
      );
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        throwingObs({ errorMessage: 'p' }),
      );
      component.beneficiaryDetails = { ageVal: 30 };
      component.getVaccinationTypeAndDoseMaster();
      component.getPreviousCovidVaccinationDetails([], []);
      expect(console.log).toHaveBeenCalledWith('error', 'm');
      expect(console.log).toHaveBeenCalledWith('error', 'p');
    });
  });
});
