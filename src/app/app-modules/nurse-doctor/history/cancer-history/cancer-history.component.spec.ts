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
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import { CancerHistoryComponent } from './cancer-history.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('CancerHistoryComponent', () => {
  let component: CancerHistoryComponent;
  let fixture: ComponentFixture<CancerHistoryComponent>;
  let doctorService: any;
  let confirmation: any;
  let storage: any;
  let benDetails$: BehaviorSubject<any>;

  const SESSION = {
    visitID: 11,
    beneficiaryRegID: 22,
    providerServiceID: 3,
    userName: 'nurse',
    beneficiaryID: 44,
    sessionID: 5,
    benFlowID: 66,
    visitCode: 77,
    serviceLineDetails: JSON.stringify({ vanID: 8, parkingPlaceID: 9 }),
  };

  const buildForm = () =>
    new FormGroup({
      cancerPatientFamilyMedicalHistoryForm: new FormGroup({}),
      cancerPatientPerosnalHistoryForm: new FormGroup({
        tobaccoUse: new FormControl(null),
        dietType: new FormControl(null),
      }),
      cancerPatientObstetricHistoryForm: new FormGroup({
        pregnancyStatus: new FormControl(null),
      }),
    });

  beforeEach(async () => {
    doctorService = autoSpy(DoctorService);
    benDetails$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerHistoryComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: DoctorService, useValue: doctorService },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerHistoryComponent, '')
      .compileComponents();

    confirmation = TestBed.inject(ConfirmationService);
    storage = TestBed.inject(SessionStorageService);
    fixture = TestBed.createComponent(CancerHistoryComponent);
    component = fixture.componentInstance;
    component.nurseCancerHistoryForm = buildForm();
  });

  describe('ngOnInit', () => {
    beforeEach(() => fixture.detectChanges());

    it('extracts the three sub-forms and sets the language', () => {
      const form = component.nurseCancerHistoryForm;
      expect(component.cancerPatientFamilyMedicalHistoryForm).toBe(
        form.get('cancerPatientFamilyMedicalHistoryForm') as FormGroup,
      );
      expect(component.cancerPatientPerosnalHistoryForm).toBe(
        form.get('cancerPatientPerosnalHistoryForm') as FormGroup,
      );
      expect(component.cancerPatientObstetricHistoryForm).toBe(
        form.get('cancerPatientObstetricHistoryForm') as FormGroup,
      );
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('keeps the latest non-null beneficiary details', () => {
      expect(component.templateBeneficiaryDetails).toBeUndefined();
      benDetails$.next({ beneficiaryName: 'A' });
      expect(component.templateBeneficiaryDetails).toEqual({
        beneficiaryName: 'A',
      });
      benDetails$.next(null);
      expect(component.templateBeneficiaryDetails).toEqual({
        beneficiaryName: 'A',
      });
    });
  });

  describe('ngOnChanges', () => {
    it('fetches history in view mode', () => {
      component.mode = 'view';
      component.ngOnChanges({});
      expect(doctorService.getCancerHistoryDetails).toHaveBeenCalledWith(
        22,
        11,
      );
    });

    it('fetches history for specialist flag 100', () => {
      storage.setItem('specialistFlag', '100');
      component.ngOnChanges({});
      expect(doctorService.getCancerHistoryDetails).toHaveBeenCalledTimes(1);
    });

    it('does not fetch for other specialist flags or modes', () => {
      storage.setItem('specialistFlag', '5');
      component.mode = 'new';
      component.ngOnChanges({});
      expect(doctorService.getCancerHistoryDetails).not.toHaveBeenCalled();
      expect(doctorService.updateCancerHistoryDetails).not.toHaveBeenCalled();
    });

    it('updates history in update mode', () => {
      spyOn(component, 'updatePateintHistory');
      component.mode = 'update';
      component.ngOnChanges({});
      expect(component.updatePateintHistory).toHaveBeenCalledWith(
        component.nurseCancerHistoryForm,
      );
    });
  });

  describe('updatePateintHistory', () => {
    it('sends session details and alerts success', () => {
      doctorService.updateCancerHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } }),
      );
      const form = component.nurseCancerHistoryForm;
      form.markAsDirty();

      component.updatePateintHistory(form);

      expect(doctorService.updateCancerHistoryDetails).toHaveBeenCalledWith(
        form,
        {
          beneficiaryRegID: 22,
          benVisitID: 11,
          providerServiceMapID: 3,
          modifiedBy: 'nurse',
          beneficiaryID: 44,
          sessionID: 5,
          parkingPlaceID: 9,
          vanID: 8,
          benFlowID: 66,
          visitCode: 77,
        },
      );
      expect(confirmation.alert).toHaveBeenCalledWith('saved', 'success');
      expect(form.pristine).toBeTrue();
    });

    it('alerts the error message on a non-200 response', () => {
      doctorService.updateCancerHistoryDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.updatePateintHistory(component.nurseCancerHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on http error', () => {
      doctorService.updateCancerHistoryDetails.and.returnValue(
        throwingObs('down'),
      );
      component.updatePateintHistory(component.nurseCancerHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
    });
  });

  describe('getCancerHistory', () => {
    it('patches personal and obstetric forms and stores family history', () => {
      doctorService.getCancerHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            benPersonalHistory: { tobaccoUse: 'Yes' },
            benPersonalDietHistory: { dietType: 'Veg' },
            benFamilyHistory: [{ disease: 'X' }],
            benObstetricHistory: { pregnancyStatus: 'No' },
          },
        }),
      );

      component.getCancerHistory(22, 11);

      const form = component.nurseCancerHistoryForm;
      expect(form.get('cancerPatientPerosnalHistoryForm')?.value).toEqual({
        tobaccoUse: 'Yes',
        dietType: 'Veg',
      });
      expect(form.get('cancerPatientObstetricHistoryForm')?.value).toEqual({
        pregnancyStatus: 'No',
      });
      expect(component.familyHistoryData).toEqual([{ disease: 'X' }]);
    });

    it('ignores unsuccessful responses', () => {
      doctorService.getCancerHistoryDetails.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getCancerHistory(22, 11);
      expect(component.familyHistoryData).toBeUndefined();
    });
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    component.getCancerHistory(22, 11);
    const benSub = spyOn(
      component.beneficiaryDetailsSubscription,
      'unsubscribe',
    ).and.callThrough();
    const histSub = spyOn(
      component.cancerHistorySubscription,
      'unsubscribe',
    ).and.callThrough();
    component.ngOnDestroy();
    expect(benSub).toHaveBeenCalled();
    expect(histSub).toHaveBeenCalled();
  });

  it('refreshes language on ngDoCheck', () => {
    component.currentLanguageSet = undefined;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
