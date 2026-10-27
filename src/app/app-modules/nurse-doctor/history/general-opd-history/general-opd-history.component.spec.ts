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
import { FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import { GeneralOpdHistoryComponent } from './general-opd-history.component';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { DoctorService } from '../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const SECTIONS = [
  'pastHistory',
  'comorbidityHistory',
  'medicationHistory',
  'personalHistory',
  'familyHistory',
  'menstrualHistory',
  'perinatalHistory',
  'pastObstericHistory',
  'immunizationHistory',
  'otherVaccines',
  'feedingHistory',
  'developmentHistory',
  'physicalActivityHistory',
  'generalPersonalHistory',
];

function buildHistoryForm() {
  const controls: any = {};
  SECTIONS.forEach((s) => (controls[s] = new FormGroup({})));
  return new FormGroup(controls);
}

describe('GeneralOpdHistoryComponent', () => {
  let component: GeneralOpdHistoryComponent;
  let fixture: ComponentFixture<GeneralOpdHistoryComponent>;
  let doctorService: any;
  let benService: any;
  let ncdService: any;
  let confirmation: any;
  let session: any;
  let beneficiary$: BehaviorSubject<any>;
  let enablingIdrs$: BehaviorSubject<any>;

  beforeEach(async () => {
    beneficiary$ = new BehaviorSubject<any>(null);
    enablingIdrs$ = new BehaviorSubject<any>(false);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralOpdHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 11,
              parkingPlaceID: 22,
            }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            providerServiceID: 'P1',
            userName: 'nurse1',
            beneficiaryID: 'BEN',
            sessionID: 'S1',
            benFlowID: 'F1',
            visitCode: 'VC1',
          },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: beneficiary$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralOpdHistoryComponent);
    component = fixture.componentInstance;
    component.patientHistoryForm = buildHistoryForm();
    doctorService = TestBed.inject(DoctorService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    ncdService = {} as any;
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
  });







  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.beneficiary = { ageVal: 30 };
    });

    it('updates general history in update mode', () => {
      session.setItem('visitCategory', 'General OPD');
      const spy = spyOn(component, 'updatePatientGeneralHistory');
      component.mode = 'update';
      component.ngOnChanges({ mode: {} });
      expect(spy).toHaveBeenCalledWith(component.patientHistoryForm);
    });

    it('updates NCD screening history in update mode for NCD screening', () => {
      session.setItem('visitCategory', 'NCD screening');
      const spy = spyOn(component, 'updatePatientNCDScreeningHistory');
      component.mode = 'update';
      component.ngOnChanges({ mode: {} });
      expect(spy).toHaveBeenCalledWith(component.patientHistoryForm);
    });

    it('does not update when mode is not update', () => {
      const spy = spyOn(component, 'updatePatientGeneralHistory');
      component.mode = 'view';
      component.ngOnChanges({ mode: {} });
      expect(spy).not.toHaveBeenCalled();
    });

    it('recomputes obstetric flag on pregnancyStatus / primiGravida change', () => {
      const spy = spyOn(component, 'canShowObstetricHistory');
      component.ngOnChanges({ pregnancyStatus: {}, primiGravida: {} });
      expect(spy).toHaveBeenCalledTimes(2);
      expect(component.pastHistory).toBe(
        component.patientHistoryForm.get('pastHistory') as FormGroup,
      );
    });
  });

  describe('updatePatientGeneralHistory', () => {
    beforeEach(() => {
      component.beneficiary = { ageVal: 30 };
    });


    it('fetches HRP details for ANC', () => {
      session.setItem('visitCategory', 'ANC');
      doctorService.updateGeneralHistory.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } }),
      );
      const hrp = spyOn(component, 'getHRPDetails');
      component.updatePatientGeneralHistory(component.patientHistoryForm);
      expect(hrp).toHaveBeenCalled();
    });

    it('alerts error message on failure status', () => {
      doctorService.updateGeneralHistory.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.updatePatientGeneralHistory(component.patientHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on observable error', () => {
      doctorService.updateGeneralHistory.and.returnValue(throwingObs('boom'));
      component.updatePatientGeneralHistory(component.patientHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('boom', 'error');
    });
  });

  describe('updatePatientNCDScreeningHistory', () => {
    beforeEach(() => {
      component.beneficiary = { ageVal: 40 };
    });


    it('alerts failure', () => {
      doctorService.updateNCDScreeningHistory.and.returnValue(
        of({ statusCode: 5000, data: null, errorMessage: 'nope' }),
      );
      component.updatePatientNCDScreeningHistory(component.patientHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('nope', 'error');
    });

    it('alerts on error', () => {
      doctorService.updateNCDScreeningHistory.and.returnValue(
        throwingObs('err'),
      );
      component.updatePatientNCDScreeningHistory(component.patientHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('err', 'error');
    });
  });

  describe('getHRPDetails', () => {
    it('sets HRP positive', () => {
      doctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } }),
      );
      component.getHRPDetails();
      expect(doctorService.getHRPDetails).toHaveBeenCalledWith('B1', 'VC1');
      expect(benService.setHRPPositive).toHaveBeenCalled();
    });

    it('resets HRP positive', () => {
      doctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } }),
      );
      component.getHRPDetails();
      expect(benService.resetHRPPositive).toHaveBeenCalled();
    });

    it('does nothing for bad response', () => {
      doctorService.getHRPDetails.and.returnValue(of({ statusCode: 5000 }));
      component.getHRPDetails();
      expect(benService.setHRPPositive).not.toHaveBeenCalled();
      expect(benService.resetHRPPositive).not.toHaveBeenCalled();
    });
  });


  it('ngOnDestroy tolerates missing subscriptions', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toBeTruthy();
    expect(ncdService).toBeTruthy();
  });
});
