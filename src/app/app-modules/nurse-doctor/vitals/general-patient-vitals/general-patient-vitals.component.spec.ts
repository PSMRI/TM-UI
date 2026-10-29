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
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, EMPTY, of } from 'rxjs';

import { GeneralPatientVitalsComponent } from './general-patient-vitals.component';
import { AudioRecordingService } from '../../shared/services/audio-recording.service';
import { DoctorService, NurseService } from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { TestInVitalsService } from '../../shared/services/test-in-vitals.service';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { MmuRbsDetailsComponent } from 'src/app/app-modules/core/components/mmu-rbs-details/mmu-rbs-details.component';
import { environment } from 'src/environments/environment';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

describe('GeneralPatientVitalsComponent', () => {
  let component: GeneralPatientVitalsComponent;
  let fixture: ComponentFixture<GeneralPatientVitalsComponent>;
  let doctor: any;
  let nurse: any;
  let idrs: any;
  let hrp: any;
  let testInVitals: any;
  let ncd: any;
  let benService: any;
  let confirm: any;
  let dialog: any;
  let tracking: any;
  let session: any;
  let form: FormGroup;
  let ben$: BehaviorSubject<any>;
  let ncdTemp$: BehaviorSubject<any>;
  let rbsInv$: BehaviorSubject<any>;
  let diabetes$: BehaviorSubject<any>;
  let enablingIdrs$: BehaviorSubject<any>;
  let screeningDiseases$: BehaviorSubject<any>;
  let routeParams: any;
  const RECHECK = LANGUAGE_EN.alerts.info.recheckValue;

  const ADULT_M = {
    ageVal: 30,
    age: '30 years - 0 months',
    genderName: 'Male',
  };
  const ADULT_F = {
    ageVal: 30,
    age: '30 years - 0 months',
    genderName: 'Female',
  };
  const TEEN_F = {
    ageVal: 10,
    age: '10 years - 2 months',
    genderName: 'Female',
  };

  let audio: any;

  async function setup(
    opts: {
      session?: Record<string, any>;
      attendant?: string;
      ben?: any;
      visitCategory?: string;
      mode?: string;
    } = {},
  ) {
    ben$ = new BehaviorSubject<any>(
      opts.ben === undefined ? ADULT_M : opts.ben,
    );
    ncdTemp$ = new BehaviorSubject<any>(undefined);
    rbsInv$ = new BehaviorSubject<any>(undefined);
    diabetes$ = new BehaviorSubject<any>(0);
    enablingIdrs$ = new BehaviorSubject<any>(false);
    screeningDiseases$ = new BehaviorSubject<any>(false);
    routeParams = { attendant: opts.attendant ?? 'doctor' };
    audio = autoSpy(AudioRecordingService);
    audio.getRecordedTime.and.returnValue(of('00:05'));
    audio.getRecordedBlob.and.returnValue(EMPTY);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [GeneralPatientVitalsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            visitID: 'V1',
            beneficiaryRegID: 'B1',
            visitCode: 'VC1',
            ...(opts.session ?? {}),
          },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: AudioRecordingService,
          useValue: audio,
        },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {
            ncdTemp$,
            rbsSelectedInInvestigation$: rbsInv$,
            rbsTestResultFromDoctorFetch: null,
            enableLAssessment$: new BehaviorSubject<any>(false),
            isAssessmentDone: true,
          }),
        },
        {
          provide: IdrsscoreService,
          useValue: autoSpy(IdrsscoreService, {
            diabetesSelectedFlag$: diabetes$,
          }),
        },
        {
          provide: TestInVitalsService,
          useValue: autoSpy(TestInVitalsService),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: {
            beneficiaryDetails$: ben$,
            setHRPPositive: jasmine.createSpy('setHRPPositive'),
            resetHRPPositive: jasmine.createSpy('resetHRPPositive'),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: routeParams } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(GeneralPatientVitalsComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService) as any;
    form = new GeneralUtils(
      new FormBuilder(),
      session,
    ).createGeneralVitalDetailsForm();
    component.patientVitalsForm = form;
    component.visitCategory = opts.visitCategory ?? 'General OPD';
    component.mode = opts.mode as any;
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    idrs = TestBed.inject(IdrsscoreService) as any;
    hrp = {} as any;
    testInVitals = TestBed.inject(TestInVitalsService) as any;
    ncd = {} as any;
    benService = TestBed.inject(BeneficiaryDetailsService) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
  }






  describe('hip / waist', () => {


    [
      { ben: ADULT_M, waist: 85, score: 0 },
      { ben: ADULT_M, waist: 95, score: 10 },
      { ben: ADULT_M, waist: 105, score: 20 },
      { ben: ADULT_F, waist: 75, score: 0 },
      { ben: ADULT_F, waist: 85, score: 10 },
      { ben: ADULT_F, waist: 95, score: 20 },
    ].forEach((c) => {
      it(`IDRS waist score ${c.ben.genderName} ${c.waist} -> ${c.score}`, async () => {
        await setup({ ben: c.ben });
        fixture.detectChanges();
        component.checkIDRSForWaist(c.waist);
        expect(component.IDRSWaistScore).toBe(c.score);
        expect(idrs.setIDRSScoreWaist).toHaveBeenCalledWith(c.score);
        expect(idrs.setIDRSScoreFlag).toHaveBeenCalled();
        idrs.setIDRSScoreFlag.calls.reset();
        component.IDRSWaistScore = undefined;
        component.patchIDRSForWaist(c.waist);
        expect(component.IDRSWaistScore).toBe(c.score);
        expect(idrs.setIDRSScoreFlag).not.toHaveBeenCalled();
      });
    });

  });





  describe('IoT dialogs', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });

    const cases: {
      fn: keyof GeneralPatientVitalsComponent;
      api: string;
      result: any;
      ctrl: Record<string, any>;
    }[] = [
      {
        fn: 'openIOTWeightModel',
        api: environment.startWeighturl,
        result: { result: 60 },
        ctrl: { weight_Kg: 60 },
      },
      {
        fn: 'openIOTTempModel',
        api: environment.startTempurl,
        result: { temperature: 99 },
        ctrl: { temperature: 99 },
      },
      {
        fn: 'openIOTPulseRateModel',
        api: environment.startPulseurl,
        result: { pulseRate: 70 },
        ctrl: { pulseRate: 70 },
      },
      {
        fn: 'openIOTSPO2Model',
        api: environment.startPulseurl,
        result: { spo2: 97 },
        ctrl: { sPO2: 97 },
      },
      {
        fn: 'openIOTBPModel',
        api: environment.startBPurl,
        result: { sys: 120, dia: 80 },
        ctrl: { systolicBP_1stReading: 120, diastolicBP_1stReading: 80 },
      },
      {
        fn: 'openIOTBGFastingModel',
        api: environment.startBloodGlucoseurl,
        result: { result: 90 },
        ctrl: { bloodGlucose_Fasting: 90 },
      },
      {
        fn: 'openIOTBGRandomModel',
        api: environment.startBloodGlucoseurl,
        result: { result: 110 },
        ctrl: { bloodGlucose_Random: 110 },
      },
      {
        fn: 'openIOTBGPostPrandialModel',
        api: environment.startBloodGlucoseurl,
        result: { result: 130 },
        ctrl: { bloodGlucose_2hr_PP: 130 },
      },
      {
        fn: 'openIOTRBSModel',
        api: environment.startRBSurl,
        result: { result: 150 },
        ctrl: { rbsTestResult: 150 },
      },
    ];
    cases.forEach((c) => {
      it(`${String(c.fn)} patches ${Object.keys(c.ctrl).join(',')}`, () => {
        dialog.open.and.returnValue(createDialogRefMock(c.result));
        (component[c.fn] as any)();
        expect(dialog.open).toHaveBeenCalledWith(
          IotcomponentComponent,
          jasmine.objectContaining({ data: { startAPI: c.api } }),
        );
        Object.entries(c.ctrl).forEach(([k, v]) =>
          expect(form.controls[k].value).toBe(v),
        );
        expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
          true,
        );
      });
    });






  });
});
