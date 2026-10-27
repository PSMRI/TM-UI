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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { NcdScreeningComponent } from './ncd-screening.component';
import { DoctorService } from '../shared/services/doctor.service';
import { NurseService } from '../shared/services/nurse.service';
import { MasterdataService } from '../shared/services/masterdata.service';
import { NCDScreeningUtils } from '../shared/utility/ncd-screening-utility';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { IotcomponentComponent } from '../../core/components/iotcomponent/iotcomponent.component';
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

describe('NcdScreeningComponent', () => {
  let component: NcdScreeningComponent;
  let fixture: ComponentFixture<NcdScreeningComponent>;
  let doctorService: any;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let storage: any;
  let router: Router;
  let masterData$: BehaviorSubject<any>;
  let benDetails$: BehaviorSubject<any>;
  const recheck = LANGUAGE_EN.alerts.info.recheckValue;

  const BP_TEST = { procedureID: 31, procedureName: 'BP Measurement' };
  const BG_TEST = { procedureID: 31, procedureName: 'Blood Glucose Measurement' };
  const REASONS = [
    { ncdScreeningReasonID: 1, reason: 'Age above 30' },
    { ncdScreeningReasonID: 2, reason: 'Symptoms' },
  ];
  const MASTER = {
    bloodPressureStatus: [{ bpAndDiabeticStatusID: 1, status: 'Normal' }],
    diabeticStatus: [{ bpAndDiabeticStatusID: 2, status: 'Diabetic' }],
    ncdScreeningConditions: [
      { ncdScreeningConditionID: 1, name: 'Hypertension' },
      { ncdScreeningConditionID: 2, name: 'Diabetes' },
    ],
    ncdScreeningReasons: REASONS,
  };

  beforeEach(async () => {
    doctorService = autoSpy(DoctorService);
    nurseService = autoSpy(NurseService);
    masterData$ = new BehaviorSubject<any>(null);
    benDetails$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NcdScreeningComponent],
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
          provide: MasterdataService,
          useValue: { nurseMasterData$: masterData$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(NcdScreeningComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    storage = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture = TestBed.createComponent(NcdScreeningComponent);
    component = fixture.componentInstance;
    const ncdForm = new NCDScreeningUtils(
      TestBed.inject(FormBuilder),
      storage,
    ).createNCDScreeningForm();
    ncdForm.controls['labTestOrders'].setValue([] as any);
    component.patientMedicalForm = new FormGroup({
      NCDScreeningForm: ncdForm,
      patientVisitForm: new FormGroup({}),
    });
  });

  const form = () => component.NCDScreeningForm;

  function init(mode = 'new') {
    component.mode = mode;
    fixture.detectChanges();
  }

  describe('ngOnInit', () => {
    beforeEach(() => init());

    it('extracts the sub-forms, sets the language and tomorrow', () => {
      expect(component.NCDScreeningForm).toBe(
        component.patientMedicalForm.get('NCDScreeningForm') as FormGroup,
      );
      expect(component.patientVisitForm).toBe(
        component.patientMedicalForm.get('patientVisitForm') as FormGroup,
      );
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(component.nextScreeningDate.toDateString()).toBe(
        tomorrow.toDateString(),
      );
      component.currentLanguageSet = undefined;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('stores the visit count from beneficiary details', () => {
      nurseService.getNcdScreeningVisitCount.and.returnValue(
        of({ statusCode: 200, data: { ncdScreeningVisitCount: 3 } }),
      );
      benDetails$.next({
        ageVal: 45,
        genderName: 'Female',
        beneficiaryRegID: 22,
      });
      expect(nurseService.getNcdScreeningVisitCount).toHaveBeenCalledWith(22);
      expect(component.age).toBe(45);
      expect(component.female).toBeTrue();
      expect(component.ncdScreeningVisitCount).toBe(3);
      expect(form().value.ncdScreeningVisitNo).toBe(3);
    });

    it('defaults the age to 0 when missing', () => {
      benDetails$.next({ genderName: 'Male', beneficiaryRegID: 22 });
      expect(component.age).toBe(0);
      expect(component.female).toBeFalse();
    });

    it('loads master data and filters reasons', () => {
      component.age = 25;
      masterData$.next(MASTER);
      expect(component.bloodPressureStatus).toBe(MASTER.bloodPressureStatus);
      expect(component.diabeticStatus).toBe(MASTER.diabeticStatus);
      expect(component.ncdScreeningConditions).toBe(
        MASTER.ncdScreeningConditions,
      );
      expect(component.ncdScreeningReasons).toEqual([REASONS[1]]);
      expect(doctorService.getNcdScreeningDetails).not.toHaveBeenCalled();
    });
  });

  it('does not patch the visit count in view mode', () => {
    init('view');
    nurseService.getNcdScreeningVisitCount.and.returnValue(
      of({ statusCode: 200, data: { ncdScreeningVisitCount: 3 } }),
    );
    benDetails$.next({ ageVal: 45, beneficiaryRegID: 22 });
    expect(component.ncdScreeningVisitCount).toBe(3);
    expect(form().value.ncdScreeningVisitNo).not.toBe(3);
  });

  it('fetches details in view mode and for specialists', () => {
    spyOn(component, 'getNCDScreeingDetails');
    storage.setItem('specialistFlag', '100');
    init('view');
    masterData$.next(MASTER);
    expect(component.getNCDScreeingDetails).toHaveBeenCalledWith(22, 11);
    expect(component.getNCDScreeingDetails).toHaveBeenCalledTimes(2);
  });

  it('filterNCDScreeningReasons keeps the age reason from 30', () => {
    component.age = 30;
    expect(component.filterNCDScreeningReasons(REASONS)).toEqual(REASONS);
  });

  describe('with an initialised form', () => {
    beforeEach(() => init());

    it('ngOnChanges updates in update mode only', () => {
      spyOn(component, 'updateNCDScreeningDetails');
      component.ngOnChanges();
      expect(component.updateNCDScreeningDetails).not.toHaveBeenCalled();
      component.mode = 'update';
      component.ngOnChanges();
      expect(component.updateNCDScreeningDetails).toHaveBeenCalled();
    });

    describe('getNCDScreeingDetails', () => {
      beforeEach(() => masterData$.next(MASTER));

      it('maps master values, lab orders and conditions into the form', () => {
        doctorService.getNcdScreeningDetails.and.returnValue(
          of({
            statusCode: 200,
            data: {
              anthropometryDetails: { height_cm: 170, weight_Kg: 65 },
              ncdScreeningDetails: {
                nextScreeningDate: '2026-12-01T00:00:00Z',
                ncdScreeningReasonID: 2,
                bloodPressureStatusID: 1,
                diabeticStatusID: 2,
                isBPPrescribed: true,
                isBloodGlucosePrescribed: true,
                ncdScreeningConditionList: [{ ncdScreeningConditionID: 2 }],
              },
              vitalDetails: {
                systolicBP_1stReading: 120,
                systolicBP_2ndReading: 130,
                systolicBP_3rdReading: 140,
                diastolicBP_1stReading: 80,
                diastolicBP_2ndReading: 81,
                diastolicBP_3rdReading: 85,
              },
            },
          }),
        );
        component.getNCDScreeingDetails(22, 11);

        const details = component.ncdScreeningDetails;
        expect(details.nextScreeningDate).toEqual(
          new Date('2026-12-01T00:00:00Z'),
        );
        expect(details.reasonForScreening).toBe(REASONS[1]);
        expect(details.bloodPressureStatus).toBe(MASTER.bloodPressureStatus[0]);
        expect(details.diabeticStatus).toBe(MASTER.diabeticStatus[0]);
        expect(details.ncdScreeningConditionList).toEqual([
          MASTER.ncdScreeningConditions[1],
        ]);
        expect(form().value.labTestOrders).toEqual([BP_TEST, BG_TEST]);
        expect(component.BMI).toBe(22.5);
        expect(component.checkBloodPressure).toBeTrue();
        expect(component.checkBloodGlucose).toBeTrue();
        expect(form().value.averageSystolicBP_Reading).toBe('130');
        expect(form().value.averageDiastolicBP_Reading).toBe('82');
      });

      it('ignores unsuccessful responses', () => {
        doctorService.getNcdScreeningDetails.and.returnValue(
          of({ statusCode: 5000, data: null }),
        );
        component.getNCDScreeingDetails(22, 11);
        expect(component.ncdScreeningDetails).toBeUndefined();
      });
    });

    describe('updateNCDScreeningDetails', () => {
      it('saves and returns to the worklist', () => {
        doctorService.updateNCDScreeningDetails.and.returnValue(
          of({ statusCode: 200, data: { response: 'saved' } }),
        );
        form().markAsDirty();
        component.updateNCDScreeningDetails();
        expect(doctorService.updateNCDScreeningDetails).toHaveBeenCalledWith(
          form().value,
          component.patientVisitForm.value,
        );
        expect(form().pristine).toBeTrue();
        expect(confirmation.alert).toHaveBeenCalledWith('saved', 'success');
        expect(router.navigate).toHaveBeenCalledWith([
          '/nurse-doctor/nurse-worklist',
        ]);
      });

      it('alerts failures and errors', () => {
        doctorService.updateNCDScreeningDetails.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'bad' }),
        );
        component.updateNCDScreeningDetails();
        doctorService.updateNCDScreeningDetails.and.returnValue(
          throwingObs('down'),
        );
        component.updateNCDScreeningDetails();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
      });

      it('notifies missing mandatory fields instead of saving', () => {
        ['height_cm', 'weight_Kg', 'isScreeningComplete'].forEach((name) => {
          form().controls[name].setValidators(Validators.required);
          form().controls[name].updateValueAndValidity();
        });
        component.updateNCDScreeningDetails();
        expect(confirmation.notify).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.mandatoryFields,
          [
            LANGUAGE_EN.vitalsDetails.height,
            LANGUAGE_EN.vitalsDetails.weight,
            LANGUAGE_EN.screeningComplete,
          ],
        );
        expect(doctorService.updateNCDScreeningDetails).not.toHaveBeenCalled();
      });
    });

    describe('checkScreeningTest', () => {
      it('clears BP and glucose values when their tests are not ordered', () => {
        form().patchValue({
          systolicBP_1stReading: 120,
          averageDiastolicBP_Reading: 80,
          bloodGlucose_Fasting: 90,
        });
        component.checkScreeningTest();
        expect(component.checkBloodPressure).toBeFalse();
        expect(component.checkBloodGlucose).toBeFalse();
        expect(component.systolicBP_1stReading).toBeNull();
        expect(component.averageDiastolicBP_Reading).toBeNull();
        expect(component.bloodGlucose_Fasting).toBeNull();
      });

      it('enables both sections when both tests are ordered', () => {
        form().patchValue({ labTestOrders: [BP_TEST, BG_TEST] });
        component.checkScreeningTest();
        expect(component.screeningTestList.length).toBe(2);
        expect(component.checkBloodPressure).toBeTrue();
        expect(component.checkBloodGlucose).toBeTrue();
      });
    });

    describe('anthropometry', () => {
      it('calculateBMI stores BMI in the form', () => {
        form().patchValue({ height_cm: 170, weight_Kg: 65 });
        component.calculateBMI();
        expect(component.bMI).toBe(22.5);
        expect(component.normalBMI).toBeTrue();
        form().patchValue({ weight_Kg: null });
        component.calculateBMI();
        expect(component.bMI).toBeNull();
        expect(component.normalBMI).toBeFalse();
      });

      it('hipWaistRatio uses 0.8 for women and 0.9 for men', () => {
        form().patchValue({ hipCircumference_cm: 100, waistCircumference_cm: 85 });
        component.female = true;
        component.hipWaistRatio();
        expect(component.waistHipRatio).toBe('0.85');
        expect(component.normalWaistHipRatio).toBeFalse();
        component.female = false;
        component.hipWaistRatio();
        expect(component.normalWaistHipRatio).toBeTrue();
      });

      it('hipWaistRatio needs both measurements', () => {
        form().patchValue({ hipCircumference_cm: 100 });
        component.hipWaistRatio();
        expect(component.patientWaistHipRatio).toBeUndefined();
      });

      it('checkHip uses gender specific ranges', () => {
        form().patchValue({ hipCircumference_cm: 95 });
        component.female = true;
        component.checkHip();
        expect(component.normalHip).toBeFalse();
        component.female = false;
        component.checkHip();
        expect(component.normalHip).toBeTrue();
      });

      it('checkWaist accepts 50-150', () => {
        form().patchValue({ waistCircumference_cm: 40 });
        component.checkWaist();
        expect(component.normalWaist).toBeFalse();
        form().patchValue({ waistCircumference_cm: 90 });
        component.checkWaist();
        expect(component.normalWaist).toBeTrue();
      });
    });

    describe('range checks', () => {
      const cases: [string, string, number, number][] = [
        ['checkHeight', 'height_cm', 100, 160],
        ['checkWeight', 'weight_Kg', 20, 60],
        ['checkSystolicBP1', 'systolicBP_1stReading', 80, 120],
        ['checkDiastolicBP1', 'diastolicBP_1stReading', 40, 80],
        ['checkSystolicBP2', 'systolicBP_2ndReading', 180, 120],
        ['checkDiastolicBP2', 'diastolicBP_2ndReading', 120, 80],
        ['checkSystolicBP3', 'systolicBP_3rdReading', 80, 120],
        ['checkDiastolicBP3', 'diastolicBP_3rdReading', 40, 80],
        ['checkBloodSugarFasting', 'bloodGlucose_Fasting', 40, 90],
        ['checkBloodSugarRandom', 'bloodGlucose_Random', 800, 120],
        ['checkBloodSugar2HrPostPrandial', 'bloodGlucose_2hr_PP', 40, 120],
        ['checkBloodSugarNotSpecified', 'bloodGlucose_NotSpecified', 800, 120],
      ];

      cases.forEach(([method, control, bad, good]) => {
        it(`${method} alerts only for out-of-range values`, () => {
          form().patchValue({ [control]: good });
          (component as any)[method]();
          expect(confirmation.alert).not.toHaveBeenCalled();
          form().patchValue({ [control]: bad });
          (component as any)[method]();
          expect(confirmation.alert).toHaveBeenCalledWith(recheck);
        });
      });
    });

    describe('average BP', () => {
      it('is calculated only with all three readings', () => {
        form().patchValue({
          systolicBP_1stReading: 120,
          systolicBP_2ndReading: 125,
        });
        component.calculateAverageSystolicBP();
        expect(form().value.averageSystolicBP_Reading).toBeNull();
        form().patchValue({ systolicBP_3rdReading: 131 });
        component.calculateAverageSystolicBP();
        expect(form().value.averageSystolicBP_Reading).toBe('125');
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
        ['openIOTBGFastingModel', { result: 90 }, { bloodGlucose_Fasting: 90 }],
        ['openIOTBGRandomModel', { result: 110 }, { bloodGlucose_Random: 110 }],
        [
          'openIOTBGPostPrandialModel',
          { result: 130 },
          { bloodGlucose_2hr_PP: 130 },
        ],
        [
          'openIOTBGNotSpecifiedModel',
          { result: 100 },
          { bloodGlucose_NotSpecified: 100 },
        ],
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
        });
      });

      it('openIOTWeightModel stores the weight and recalculates BMI', () => {
        spyOn(component, 'calculateBMI');
        dialog.open.and.returnValue(createDialogRefMock({ result: 60 }));
        component.openIOTWeightModel();
        expect(component.weight_Kg).toBe(60);
        expect(component.calculateBMI).toHaveBeenCalled();
      });
    });

    it('averageSystolicBP_Reading returns the diastolic average (current behaviour)', () => {
      form().patchValue({
        averageSystolicBP_Reading: '130',
        averageDiastolicBP_Reading: '82',
      });
      expect(component.averageSystolicBP_Reading).toBe('82');
    });

    it('unsubscribes on destroy', () => {
      const subs = [
        component.nurseMasterDataSubscription,
        component.beneficiaryDetailSubscription,
      ];
      component.ngOnDestroy();
      subs.forEach((s) => expect(s.closed).toBeTrue());
    });
  });
});
