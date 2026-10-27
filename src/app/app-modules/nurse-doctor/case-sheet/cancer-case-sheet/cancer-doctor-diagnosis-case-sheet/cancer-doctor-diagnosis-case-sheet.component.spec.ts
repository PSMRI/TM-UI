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
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import { of } from 'rxjs';

import { CancerDoctorDiagnosisCaseSheetComponent } from './cancer-doctor-diagnosis-case-sheet.component';
import { DoctorService } from '../../../shared/services/doctor.service';
import { MasterdataService } from '../../../shared/services/masterdata.service';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('CancerDoctorDiagnosisCaseSheetComponent', () => {
  let component: CancerDoctorDiagnosisCaseSheetComponent;
  let fixture: ComponentFixture<CancerDoctorDiagnosisCaseSheetComponent>;
  let doctorService: any;
  let registrar: any;
  let master: any;
  let confirmation: any;

  beforeEach(async () => {
    doctorService = autoSpy(DoctorService);
    registrar = autoSpy(RegistrarService);
    master = autoSpy(MasterdataService);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerDoctorDiagnosisCaseSheetComponent],
      providers: [
        ...commonTestProviders({
          session: { caseSheetBeneficiaryRegID: 55, userID: 9 },
        }),
        { provide: DoctorService, useValue: doctorService },
        { provide: RegistrarService, useValue: registrar },
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerDoctorDiagnosisCaseSheetComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    spyOn(console, 'error');
    confirmation = TestBed.inject(ConfirmationService);
    fixture = TestBed.createComponent(CancerDoctorDiagnosisCaseSheetComponent);
    component = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('sets today, the language and requests ABHA details', () => {
      const t = new Date();
      fixture.detectChanges();
      expect(component.date).toBe(
        `${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()}`,
      );
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(registrar.getHealthIdDetails).toHaveBeenCalledWith({
        beneficiaryRegID: 55,
        beneficiaryID: null,
      });
    });

    it('refreshes language on ngDoCheck', () => {
      fixture.detectChanges();
      component.currentLanguageSet = undefined;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('getHealthIDDetails', () => {
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));

    it('joins all health IDs with commas', () => {
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

    it('leaves the value empty without health details', () => {
      registrar.getHealthIdDetails.and.returnValue(
        of({ statusCode: 200, data: { BenHealthDetails: null } }),
      );
      component.getHealthIDDetails();
      expect(component.healthIDValue).toBe('');
    });

    it('alerts on a failed response or error', () => {
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

  describe('ngOnChanges', () => {
    beforeEach(() => spyOn(component, 'downloadSign'));

    it('only downloads the signature without case sheet data', () => {
      spyOn(component, 'getVaccinationTypeAndDoseMaster');
      component.ngOnChanges();
      expect(component.downloadSign).toHaveBeenCalled();
      expect(component.getVaccinationTypeAndDoseMaster).not.toHaveBeenCalled();
    });

    it('formats dates and maps vitals and diagnosis', () => {
      spyOn(component, 'getVaccinationTypeAndDoseMaster');
      component.casesheetData = {
        BeneficiaryData: {
          serviceDate: '2026-03-05T09:07:03',
          consultationDate: '2026-11-15T14:30:45',
        },
        nurseData: { currentVitals: { bp: 120 } },
        doctorData: { diagnosis: { dx: 1 } },
      };
      component.ngOnChanges();

      expect(component.beneficiaryDetails.serviceDate).toBe(
        '05/03/2026 09:07:03',
      );
      expect(component.beneficiaryDetails.consultationDate).toBe(
        '15/11/2026 14:30:45',
      );
      expect(component.currentVitals).toEqual({ bp: 120 });
      expect(component.caseSheetDiagnosisData).toEqual({ dx: 1 });
      expect(component.getVaccinationTypeAndDoseMaster).toHaveBeenCalled();
    });
  });

  describe('downloadSign', () => {
    it('uses the TC specialist ID when present', () => {
      spyOn(component, 'showSign');
      component.beneficiaryDetails = { tCSpecialistUserID: 77 };
      component.downloadSign();
      expect(doctorService.downloadSign).toHaveBeenCalledWith(77);
      expect(component.showSign).toHaveBeenCalledWith(jasmine.any(Blob));
    });

    it('falls back to the session user and logs errors', () => {
      doctorService.downloadSign.and.returnValue(throwingObs('nope'));
      component.downloadSign();
      expect(doctorService.downloadSign).toHaveBeenCalledWith(9);
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('showSign reads the blob into a data URL', (done) => {
    component.showSign(new Blob(['sig'], { type: 'text/plain' }));
    setTimeout(() => {
      expect(component.imgUrl).toContain('data:text/plain;base64,');
      done();
    }, 50);
  });

  describe('changeLanguage', () => {
    let http: any;

    beforeEach(() => {
      http = TestBed.inject(HttpServiceService);
      http.getLanguage = jasmine.createSpy('getLanguage');
      component.currentLanguageSet = LANGUAGE_EN;
      spyOn(sessionStorage, 'getItem').and.returnValue('Hindi');
    });

    it('loads the stored language file', () => {
      http.getLanguage.and.returnValue(of({ Hindi: { hi: true } }));
      component.changeLanguage();
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/Hindi.json');
      expect(component.currentLanguageSet).toEqual({ hi: true });
    });

    it('keeps the current language on an empty response or error', () => {
      http.getLanguage.and.returnValue(of(null));
      component.changeLanguage();
      http.getLanguage.and.returnValue(throwingObs());
      component.changeLanguage();
      expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    });
  });

  describe('covid vaccination', () => {
    it('skips the master lookup for beneficiaries under 12', () => {
      component.beneficiaryDetails = { ageVal: 8 };
      component.getVaccinationTypeAndDoseMaster();
      expect(master.getVaccinationTypeAndDoseMaster).not.toHaveBeenCalled();
    });

    it('loads previous vaccination details with the master lists', () => {
      spyOn(component, 'getPreviousCovidVaccinationDetails');
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({ statusCode: 200, data: { doseType: [1], vaccineType: [2] } }),
      );
      component.beneficiaryDetails = { ageVal: 30 };
      component.getVaccinationTypeAndDoseMaster();
      expect(component.getPreviousCovidVaccinationDetails).toHaveBeenCalledWith(
        [1],
        [2],
      );
    });

    it('logs master lookup errors', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        throwingObs({ errorMessage: 'x' }),
      );
      component.beneficiaryDetails = { ageVal: 30 };
      component.getVaccinationTypeAndDoseMaster();
      expect(console.log).toHaveBeenCalledWith('error', 'x');
    });

    it('resolves dose and vaccine names from the master lists', () => {
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { covidVSID: 1, doseTypeID: 2, covidVaccineTypeID: 3 },
        }),
      );
      const doses = [{ covidDoseTypeID: 1 }, { covidDoseTypeID: 2 }];
      const vaccines = [{ covidVaccineTypeID: 3 }];
      component.getPreviousCovidVaccinationDetails(doses, vaccines);
      expect(master.getPreviousCovidVaccinationDetails).toHaveBeenCalledWith(55);
      expect(component.covidVaccineDetails.doseTypeID).toEqual([doses[1]]);
      expect(component.covidVaccineDetails.covidVaccineTypeID).toEqual(
        vaccines,
      );
    });

    it('ignores responses without a vaccination record', () => {
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.getPreviousCovidVaccinationDetails([], []);
      expect(component.covidVaccineDetails).toBeUndefined();
    });
  });
});
