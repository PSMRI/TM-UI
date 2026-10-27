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
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { CancerPatientVitalsComponent } from './cancer-patient-vitals.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { NurseService } from '../../shared/services/nurse.service';
import { CancerUtils } from '../../shared/utility/cancer-utility';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

describe('CancerPatientVitalsComponent', () => {
  let component: CancerPatientVitalsComponent;
  let fixture: ComponentFixture<CancerPatientVitalsComponent>;
  let doctorService: any;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let storage: any;
  let route: any;
  let benDetails$: BehaviorSubject<any>;
  let rbsInInvestigation$: BehaviorSubject<any>;
  const recheck = LANGUAGE_EN.alerts.info.recheckValue;

  beforeEach(async () => {
    doctorService = autoSpy(DoctorService);
    rbsInInvestigation$ = new BehaviorSubject<any>(undefined);
    nurseService = autoSpy(NurseService, {
      rbsSelectedInInvestigation$: rbsInInvestigation$.asObservable(),
      mmuVisitData: false,
    });
    benDetails$ = new BehaviorSubject<any>(null);
    route = { snapshot: { params: {} } };

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerPatientVitalsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 22,
            visitID: 11,
            serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
          },
        }),
        { provide: DoctorService, useValue: doctorService },
        { provide: NurseService, useValue: nurseService },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$.asObservable() },
        },
        { provide: ActivatedRoute, useValue: route },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerPatientVitalsComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    storage = TestBed.inject(SessionStorageService);
    fixture = TestBed.createComponent(CancerPatientVitalsComponent);
    component = fixture.componentInstance;
    component.patientVitalsForm = new CancerUtils(
      TestBed.inject(FormBuilder),
      storage,
    ).createNurseCancerPatientVitalsForm();
    fixture.detectChanges();
  });

  const form = () => component.patientVitalsForm;

  describe('ngOnInit', () => {
    it('resets RBS state and loads the language', () => {
      expect(nurseService.clearRbsSelectedInInvestigation).toHaveBeenCalled();
      expect(
        doctorService.setValueToEnableVitalsUpdateButton,
      ).toHaveBeenCalledWith(false);
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.rbsSelectedInInvestigation).toBeFalse();
      rbsInInvestigation$.next(true);
      expect(component.rbsSelectedInInvestigation).toBeTrue();
    });

    it('reads age and gender from beneficiary details', () => {
      benDetails$.next({
        ageVal: 10,
        age: '10 years - 4 months',
        genderName: 'Female',
      });
      expect(component.benAge).toBe(10);
      expect(component.totalMonths).toBe(124);
      expect(component.female).toBeTrue();
      expect(component.male).toBeFalse();
      benDetails$.next({ genderName: ' Male ' });
      expect(component.male).toBeTrue();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      spyOn(component, 'getCancerVitals');
      spyOn(component, 'updateCancerVitals');
      spyOn(component, 'getPreviousVisitAnthropometry');
    });

    it('fetches in view mode and for specialists', () => {
      component.mode = 'view';
      component.ngOnChanges({});
      storage.setItem('specialistFlag', '100');
      component.mode = 'new';
      component.ngOnChanges({});
      expect(component.getCancerVitals).toHaveBeenCalledWith(22, 11);
      expect(component.getCancerVitals).toHaveBeenCalledTimes(2);
      expect(nurseService.rbsTestResultFromDoctorFetch).toBeNull();
    });

    it('updates in update mode', () => {
      component.mode = 'update';
      component.ngOnChanges({});
      expect(component.updateCancerVitals).toHaveBeenCalled();
    });

    it('loads previous anthropometry for nurses only', () => {
      component.ngOnChanges({});
      expect(component.getPreviousVisitAnthropometry).not.toHaveBeenCalled();
      route.snapshot.params.attendant = 'nurse';
      component.ngOnChanges({});
      expect(component.getPreviousVisitAnthropometry).toHaveBeenCalled();
    });
  });

  describe('getPreviousVisitAnthropometry', () => {
    it('rounds whole-number heights', () => {
      doctorService.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: '160.0' } }),
      );
      component.getPreviousVisitAnthropometry();
      expect(doctorService.getPreviousVisitAnthropometry).toHaveBeenCalledWith({
        benRegID: 22,
      });
      expect(component.height_cm).toBe(160);
    });

    it('keeps fractional heights', () => {
      doctorService.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: 160.5 } }),
      );
      component.getPreviousVisitAnthropometry();
      expect(component.height_cm).toBe(160.5);
    });

    it('ignores "not found" responses', () => {
      ['Visit code is not found', 'No data found'].forEach((response) => {
        doctorService.getPreviousVisitAnthropometry.and.returnValue(
          of({ data: { response } }),
        );
        component.getPreviousVisitAnthropometry();
      });
      expect(component.height_cm).toBeNull();
    });
  });

  describe('RBS', () => {
    it('checkDiasableRBS reflects investigation or doctor values', () => {
      expect(component.checkDiasableRBS()).toBeFalse();
      nurseService.rbsTestResultFromDoctorFetch = 120;
      expect(component.checkDiasableRBS()).toBeTrue();
      nurseService.rbsTestResultFromDoctorFetch = null;
      component.rbsSelectedInInvestigation = true;
      expect(component.checkDiasableRBS()).toBeTrue();
    });

    it('checkForRange alerts out-of-range values unless the device popup is open', () => {
      form().patchValue({ rbsTestResult: 1200 });
      component.checkForRange();
      component.rbsPopup = true;
      component.checkForRange();
      form().patchValue({ rbsTestResult: -1 });
      component.checkForRange();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
    });

    it('rbsResultChange shares the value and enables the controls', () => {
      form().patchValue({ rbsTestResult: 130 });
      expect(component.rbsResultChange()).toBeFalse();
      expect(nurseService.setRbsInCurrentVitals).toHaveBeenCalledWith(130);
      expect(form().controls['rbsTestResult'].enabled).toBeTrue();
    });

    it('rbsResultChange disables the controls when RBS comes from elsewhere', () => {
      nurseService.rbsTestResultFromDoctorFetch = 100;
      expect(component.rbsResultChange()).toBeTrue();
      expect(nurseService.setRbsInCurrentVitals).toHaveBeenCalledWith(null);
      expect(form().controls['rbsTestResult'].disabled).toBeTrue();
      expect(form().controls['rbsTestRemarks'].disabled).toBeTrue();
    });

    it('openIOTRBSModel stores the device reading', () => {
      dialog.open.and.returnValue(createDialogRefMock({ result: 150 }));
      component.openIOTRBSModel();
      expect(dialog.open).toHaveBeenCalledWith(
        IotcomponentComponent,
        jasmine.objectContaining({
          data: { startAPI: component.startRBSTest },
        }),
      );
      expect(component.rbsPopup).toBeFalse();
      expect(component.rbsTestResult).toBe(150);
      expect(nurseService.setRbsInCurrentVitals).toHaveBeenCalledWith(150);
      expect(
        doctorService.setValueToEnableVitalsUpdateButton,
      ).toHaveBeenCalledWith(true);
    });

    it('openIOTRBSModel ignores a cancelled reading', () => {
      dialog.open.and.returnValue(createDialogRefMock(null));
      component.openIOTRBSModel();
      expect(component.rbsTestResult).toBeNull();
    });
  });

  describe('updateCancerVitals', () => {
    it('saves and marks the form pristine on success', () => {
      doctorService.updateCancerVitalsDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } }),
      );
      form().markAsDirty();
      component.updateCancerVitals();
      expect(confirmation.alert).toHaveBeenCalledWith('saved', 'success');
      expect(form().pristine).toBeTrue();
    });

    it('alerts failures and errors', () => {
      doctorService.updateCancerVitalsDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.updateCancerVitals();
      doctorService.updateCancerVitalsDetails.and.returnValue(
        throwingObs('down'),
      );
      component.updateCancerVitals();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
    });

    it('notifies missing required fields instead of saving', () => {
      ['height_cm', 'weight_Kg'].forEach((name) => {
        form().controls[name].setValidators(Validators.required);
        form().controls[name].updateValueAndValidity();
      });
      component.updateCancerVitals();
      expect(confirmation.notify).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.belowFields,
        [LANGUAGE_EN.vitalsDetails.height, LANGUAGE_EN.vitalsDetails.weight],
      );
      expect(doctorService.updateCancerVitalsDetails).not.toHaveBeenCalled();
    });
  });

  describe('getCancerVitals', () => {
    it('patches vitals and recomputes the flags', () => {
      doctorService.getCancerVitalsDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            benVitalDetails: {
              height_cm: 170,
              weight_Kg: 90,
              waistCircumference_cm: 95,
              hbA1C: 6,
              bloodGlucose_Random: 150,
              bloodGlucose_2HrPostPrandial: 150,
              bloodGlucose_Fasting: 110,
              systolicBP_1stReading: 120,
              systolicBP_2ndReading: 140,
              rbsTestResult: 99,
            },
          },
        }),
      );
      component.getCancerVitals(22, 11);

      expect(component.weight_Kg).toBe(90);
      expect(component.BMI).toBe(31.1);
      expect(component.normalBMI).toBeFalse();
      expect(component.normalWaist).toBeFalse();
      expect(component.normalHbA1C).toBeFalse();
      expect(component.diabeticRangeRandom).toBeTrue();
      expect(component.diabeticRangePostPrandial).toBeTrue();
      expect(component.diabeticRangeFasting).toBeTrue();
      expect(component.showBP3).toBeTrue();
      expect(nurseService.rbsTestResultFromDoctorFetch).toBe(99);
    });

    it('does not take RBS from MMU visits', () => {
      nurseService.mmuVisitData = true;
      doctorService.getCancerVitalsDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { benVitalDetails: { rbsTestResult: 99 } },
        }),
      );
      component.getCancerVitals(22, 11);
      expect(nurseService.rbsTestResultFromDoctorFetch).toBeNull();
    });
  });

  describe('BMI', () => {
    it('is null without height and weight', () => {
      component.calculateBMI(null, null);
      expect(component.BMI).toBeNull();
      expect(component.normalBMI).toBeFalse();
    });

    it('is normal between 18.5 and 24.9 for adults', () => {
      form().patchValue({ height_cm: 170, weight_Kg: 65 });
      component.calculateBMI(170, 65);
      expect(component.BMI).toBe(22.5);
      expect(component.normalBMI).toBeTrue();
    });

    it('uses the BMI status service for children aged 5-19', () => {
      component.benGenderAndAge = {
        age: '10 years - 0 months',
        genderName: 'Male',
      };
      nurseService.calculateBmiStatus.and.returnValue(
        of({ statusCode: 200, data: { bmiStatus: 'NORMAL' } }),
      );
      component.BMI = 15;
      component.calculateBMIStatusBasedOnAge();
      expect(nurseService.calculateBmiStatus).toHaveBeenCalledWith({
        yearMonth: '10 years - 0 months',
        gender: 'Male',
        bmi: 15,
      });
      expect(component.bmiStatusMinor).toBe('normal');
      expect(component.normalBMI).toBeTrue();
    });

    it('alerts BMI status failures and errors', () => {
      component.benGenderAndAge = {
        age: '10 years - 0 months',
        genderName: 'Female',
      };
      nurseService.calculateBmiStatus.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.calculateBMIStatusBasedOnAge();
      nurseService.calculateBmiStatus.and.returnValue(throwingObs('down'));
      component.calculateBMIStatusBasedOnAge();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
    });
  });

  describe('range checks', () => {
    const cases: [string, number, number][] = [
      ['checkHeight', 5, 150],
      ['checkWeight', 20, 60],
      ['checkWaist', 40, 80],
      ['checkSystolicBP1', 80, 120],
      ['checkDiastolicBP1', 40, 80],
      ['checkSystolicBP2', 180, 120],
      ['checkDiastolicBP2', 120, 80],
      ['checkSystolicBP3', 80, 120],
      ['checkDiastolicBP3', 40, 80],
      ['checkHbA1C', 7, 5],
      ['checkHemoglobin', 1, 12],
      ['checkBloodSugarFasting', 40, 90],
      ['checkBloodSugarRandom', 800, 120],
      ['checkBloodSugar2HrPostPrandial', 40, 120],
    ];

    cases.forEach(([method, bad, good]) => {
      it(`${method} alerts only for out-of-range values`, () => {
        (component as any)[method](good);
        expect(confirmation.alert).not.toHaveBeenCalled();
        (component as any)[method](bad);
        expect(confirmation.alert).toHaveBeenCalledWith(recheck);
      });
    });

    it('checkSpo2 alerts outside 1-100', () => {
      form().patchValue({ sPO2: 98 });
      component.checkSpo2();
      expect(confirmation.alert).not.toHaveBeenCalled();
      form().patchValue({ sPO2: 120 });
      component.checkSpo2();
      expect(confirmation.alert).toHaveBeenCalledWith(recheck);
    });
  });

  describe('normal ranges', () => {
    it('uses 80cm waist for non-pregnant women and 90cm otherwise', () => {
      component.female = true;
      component.pregnancyStatus = 'No';
      component.checkNormalWaist(85);
      expect(component.normalWaist).toBeFalse();
      component.female = false;
      component.checkNormalWaist(85);
      expect(component.normalWaist).toBeTrue();
    });

    it('leaves the waist flag for pregnant women', () => {
      component.female = true;
      component.pregnancyStatus = 'Yes';
      component.normalWaist = true;
      component.checkNormalWaist(120);
      expect(component.normalWaist).toBeTrue();
    });

    it('flags HbA1c and sugar thresholds', () => {
      component.checkNormalHbA1c(5.7);
      expect(component.normalHbA1C).toBeTrue();
      component.checkNormalBloodSugarFasting(100);
      expect(component.diabeticRangeFasting).toBeFalse();
      component.checkNormalBloodSugarRandom(140);
      expect(component.diabeticRangeRandom).toBeFalse();
      component.checkNormalBloodSugarPostPrandial(141);
      expect(component.diabeticRangePostPrandial).toBeTrue();
    });

    it('shows a third BP reading for large differences only', () => {
      form().patchValue({
        diastolicBP_1stReading: 80,
        diastolicBP_2ndReading: 84,
        systolicBP_1stReading: 120,
        systolicBP_2ndReading: 125,
      });
      component.canShowBP3();
      expect(component.showBP3).toBeFalse();
      form().patchValue({ diastolicBP_2ndReading: 90 });
      component.canShowBP3();
      expect(component.showBP3).toBeTrue();
    });
  });

  describe('systolic/diastolic consistency', () => {
    const cases: [string, string, string][] = [
      ['checkSystolicGreater1', 'systolicBP_1stReading', 'sysBp'],
      ['checkSystolicGreater2', 'systolicBP_2ndReading', 'sysBp'],
      ['checkSystolicGreater3', 'systolicBP_3rdReading', 'sysBp'],
      ['checkDiastolicLesser1', 'diastolicBP_1stReading', 'DiaBp'],
      ['checkDiastolicLesser2', 'diastolicBP_2ndReading', 'DiaBp'],
      ['checkDiastolicLesser3', 'diastolicBP_3rdReading', 'DiaBp'],
    ];

    cases.forEach(([method, control, alertKey]) => {
      it(`${method} clears ${control} when systolic <= diastolic`, () => {
        form().patchValue({ [control]: 80 });
        (component as any)[method]('120', '80');
        expect(form().value[control]).toBe(80);
        (component as any)[method](null, '80');
        (component as any)[method]('80', '90');
        expect(form().value[control]).toBeNull();
        expect(confirmation.alert).toHaveBeenCalledOnceWith(
          LANGUAGE_EN.alerts.info[alertKey],
        );
      });
    });
  });

  describe('IoT devices', () => {
    const cases: [string, any, Record<string, any>][] = [
      ['openIOTSPO2Model', { spo2: 97 }, { sPO2: 97 }],
      ['openIOTPulseRateModel', { pulseRate: 72 }, {}],
      ['openIOTTempModel', { temperature: 98 }, {}],
      [
        'openIOTBP1Model',
        { sys: 120, dia: 80 },
        { systolicBP_1stReading: 120, diastolicBP_1stReading: 80 },
      ],
      [
        'openIOTBP2Model',
        { sys: 121, dia: 81 },
        { systolicBP_2ndReading: 121, diastolicBP_2ndReading: 81 },
      ],
      [
        'openIOTBP3Model',
        { sys: 122, dia: 82 },
        { systolicBP_3rdReading: 122, diastolicBP_3rdReading: 82 },
      ],
      ['openIOTHemoglobinModel', { result: 12 }, { hemoglobin: 12 }],
      ['openIOTBGFastingModel', { result: 90 }, { bloodGlucose_Fasting: 90 }],
      ['openIOTBGRandomModel', { result: 110 }, { bloodGlucose_Random: 110 }],
      [
        'openIOTBGPostPrandialModel',
        { result: 130 },
        { bloodGlucose_2HrPostPrandial: 130 },
      ],
    ];

    cases.forEach(([method, reading, expected]) => {
      it(`${method} stores the device reading`, () => {
        dialog.open.and.returnValue(createDialogRefMock(reading));
        (component as any)[method]();
        expect(dialog.open).toHaveBeenCalledWith(
          IotcomponentComponent,
          jasmine.objectContaining({ disableClose: true }),
        );
        expect(form().value).toEqual(jasmine.objectContaining(expected));
        expect(
          doctorService.setValueToEnableVitalsUpdateButton,
        ).toHaveBeenCalledWith(true);
      });
    });

    it('openIOTWeightModel stores the weight and recalculates BMI', () => {
      spyOn(component, 'calculateBMI');
      dialog.open.and.returnValue(createDialogRefMock({ result: 60 }));
      component.openIOTWeightModel();
      expect(component.weight_Kg).toBe(60);
      expect(component.calculateBMI).toHaveBeenCalledWith(60, 60);
    });
  });

  it('ngOnDestroy unsubscribes and clears the doctor RBS value', () => {
    component.getPreviousVisitAnthropometry();
    nurseService.rbsTestResultFromDoctorFetch = 5;
    const subs = [
      component.beneficiaryDetailSubscription,
      component.rbsSelectedInInvestigationSubscription,
      component.previousAnthropometryDataSubscription,
    ];
    component.ngOnDestroy();
    subs.forEach((s) => expect(s.closed).toBeTrue());
    expect(nurseService.rbsTestResultFromDoctorFetch).toBeNull();
  });

  it('exposes vitals through getters', () => {
    form().patchValue({
      waistCircumference_cm: 80,
      systolicBP_3rdReading: 1,
      diastolicBP_3rdReading: 2,
      hbA1C: 5,
      hemoglobin: 12,
      bloodGlucose_Fasting: 90,
      bloodGlucose_Random: 100,
      bloodGlucose_2HrPostPrandial: 110,
    });
    expect(component.waistCircumference_cm).toBe(80);
    expect(component.systolicBP_3rdReading).toBe(1);
    expect(component.diastolicBP_3rdReading).toBe(2);
    expect(component.hbA1C).toBe(5);
    expect(component.hemoglobin).toBe(12);
    expect(component.bloodGlucose_Fasting).toBe(90);
    expect(component.bloodGlucose_Random).toBe(100);
    expect(component.bloodGlucose_2HrPostPrandial).toBe(110);
  });
});
