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

import { ObstetricExaminationComponent } from './obstetric-examination.component';
import { NurseService } from 'src/app/app-modules/nurse-doctor/shared/services/nurse.service';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services/masterdata.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('ObstetricExaminationComponent', () => {
  let component: ObstetricExaminationComponent;
  let fixture: ComponentFixture<ObstetricExaminationComponent>;
  let nurseService: any;
  let confirmation: any;
  let masterData$: BehaviorSubject<any>;
  let benDetails$: BehaviorSubject<any>;
  let lmp$: BehaviorSubject<any>;

  const BEN = { beneficiaryRegID: 22, benFlowID: 33, beneficiaryName: 'Asha' };

  beforeEach(async () => {
    lmp$ = new BehaviorSubject<any>(null);
    nurseService = autoSpy(NurseService, {
      lmpFetosenseTestValue$: lmp$.asObservable(),
    });
    nurseService.fetchPrescribedFetosenseTests.and.returnValue(
      of({ statusCode: 200, data: { benFetosenseData: [] } }),
    );
    masterData$ = new BehaviorSubject<any>(null);
    benDetails$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ObstetricExaminationComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({ vanID: 7 }),
            providerServiceID: '4',
            userName: 'nurse',
          },
        }),
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
      .overrideTemplate(ObstetricExaminationComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    confirmation = TestBed.inject(ConfirmationService);
    fixture = TestBed.createComponent(ObstetricExaminationComponent);
    component = fixture.componentInstance;
    component.obstetricExaminationForANCForm = new FormGroup({
      fetalHeartSounds: new FormControl('Audible'),
      fetalHeartRate_BeatsPerMinute: new FormControl(140),
      sfh: new FormControl(20),
    });
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('clears the LMP and sets the language', () => {
      expect(nurseService.clearLMPForFetosenseTest).toHaveBeenCalled();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      component.current_language_set = undefined;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('stores the fetosense test master', () => {
      masterData$.next({ fetosenseTestMaster: [{ id: 1 }] });
      expect(component.fetosenseTestMaster).toEqual([{ id: 1 }]);
    });

    it('loads prescribed tests once the beneficiary is known', () => {
      nurseService.fetchPrescribedFetosenseTests.and.returnValue(
        of({
          statusCode: 200,
          data: { benFetosenseData: [{ foetalMonitorTestId: 5 }] },
        }),
      );
      benDetails$.next(BEN);
      expect(component.beneficiary).toBe(BEN);
      expect(nurseService.fetchPrescribedFetosenseTests).toHaveBeenCalledWith(
        33,
      );
      expect(component.checkTestPrescribed(5)).toBeTrue();
      expect(component.checkTestPrescribed(6)).toBeFalse();
    });

    it('tracks the LMP date', () => {
      const lmp = new Date(2026, 0, 1);
      lmp$.next(lmp);
      expect(component.lmpDate).toBe(lmp);
    });
  });

  it('resetFetalHeartRate clears the rate when not audible', () => {
    component.resetFetalHeartRate({ value: 'Audible' });
    expect(
      component.obstetricExaminationForANCForm.value
        .fetalHeartRate_BeatsPerMinute,
    ).toBe(140);
    component.resetFetalHeartRate({ value: 'Not Audible' });
    expect(
      component.obstetricExaminationForANCForm.value
        .fetalHeartRate_BeatsPerMinute,
    ).toBeNull();
  });

  it('exposes fetal heart sounds and SFH', () => {
    expect(component.fetalHeartSounds).toBe('Audible');
    expect(component.SFH).toBe(20);
  });

  describe('getPrescribedTestDetails', () => {
    beforeEach(() => (component.beneficiary = BEN));

    it('alerts failures and errors', () => {
      nurseService.fetchPrescribedFetosenseTests.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.getPrescribedTestDetails();
      nurseService.fetchPrescribedFetosenseTests.and.returnValue(
        throwingObs('down'),
      );
      component.getPrescribedTestDetails();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
    });
  });

  describe('sendTestDetails', () => {
    beforeEach(() => (component.beneficiary = BEN));

    it('asks for the LMP first', () => {
      component.sendTestDetails(1, 'NST');
      component.lmpDate = new Date('invalid');
      component.sendTestDetails(1, 'NST');
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.pleaseSelectLastMenstrualPeriod,
        'info',
      );
      expect(nurseService.sendTestDetailsToFetosense).not.toHaveBeenCalled();
    });

    it('sends the test request and shows the device status', () => {
      component.lmpDate = new Date(2026, 0, 15);
      nurseService.sendTestDetailsToFetosense.and.returnValue(
        of({ statusCode: 200, data: { response: 'Test raised' } }),
      );
      component.sendTestDetails(5, 'NST');
      expect(nurseService.sendTestDetailsToFetosense).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beneficiaryRegID: 22,
          benFlowID: 33,
          motherLMPDate: '2026-01-15',
          motherName: 'Asha',
          foetalMonitorTestId: 5,
          testName: 'NST',
          vanID: 7,
          ProviderServiceMapID: 4,
          createdBy: 'nurse',
        }),
      );
      expect(component.testStaus).toBe('Test raised');
      expect(nurseService.fetchPrescribedFetosenseTests).toHaveBeenCalled();
      expect(confirmation.alertFetsenseMessage).toHaveBeenCalledWith(
        'Test raised',
        'Fetosense Device',
      );
    });

    it('alerts failures and errors', () => {
      component.lmpDate = new Date(2026, 0, 15);
      nurseService.sendTestDetailsToFetosense.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.sendTestDetails(5, 'NST');
      nurseService.sendTestDetailsToFetosense.and.returnValue(
        throwingObs('down'),
      );
      component.sendTestDetails(5, 'NST');
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
    });
  });

  it('getPreviousPastHistory is a no-op', () => {
    expect(component.getPreviousPastHistory()).toBeUndefined();
  });

  it('unsubscribes on destroy', () => {
    const subs = [
      component.beneficiaryDetailsSubscription,
      component.nurseMasterDataSubscription,
    ];
    component.ngOnDestroy();
    subs.forEach((s) => expect(s.closed).toBeTrue());
  });
});
