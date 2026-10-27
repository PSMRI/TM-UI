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
import { FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { ComorbidityConcurrentConditionsComponent } from './comorbidity-concurrent-conditions.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const makeConditions = () => [
  { comorbidCondition: 'Diabetes' },
  { comorbidCondition: 'Asthma' },
  { comorbidCondition: 'None' },
  { comorbidCondition: 'Other' },
  { comorbidCondition: 'Nil' },
];

describe('ComorbidityConcurrentConditionsComponent', () => {
  let component: ComorbidityConcurrentConditionsComponent;
  let fixture: ComponentFixture<ComorbidityConcurrentConditionsComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  let listen$: Subject<any>;
  let nurseService: any;
  let hrp: any;
  let confirmation: any;
  let dialog: any;
  let session: any;
  let tracking: any;
  let C: any[];

  const list = () =>
    component.comorbidityConcurrentConditionsForm.controls[
      'comorbidityConcurrentConditionsList'
    ] as FormArray;

  beforeEach(async () => {
    C = makeConditions();
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>({ age: '30 years - 1 months' });
    listen$ = new Subject<any>();
    const nurse = autoSpy(NurseService);
    (nurse.listen as any).and.returnValue(listen$.asObservable());
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ComorbidityConcurrentConditionsComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'B1' } }),
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$.asObservable(),
          }),
        },
        { provide: NurseService, useValue: nurse },
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateHistoryResponse$: history$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: beneficiary$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ComorbidityConcurrentConditionsComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ComorbidityConcurrentConditionsComponent);
    component = fixture.componentInstance;
    component.comorbidityConcurrentConditionsForm = new FormGroup({
      comorbidityConcurrentConditionsList: new FormArray<any>([]),
    });
    nurseService = TestBed.inject(NurseService);
    hrp = {} as any;
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
  });


  describe('comorbid filter listener', () => {
    it('sets status true for COVID-19 screening with comorbid flag', () => {
      session.setItem('setComorbid', 'true');
      session.setItem('visiCategoryANC', 'COVID-19 Screening');
      listen$.next('x');
      expect(component.ComorbidStatus).toBe('true');
    });

    it('sets status false otherwise', () => {
      component.ComorbidStatus = 'true';
      session.setItem('setComorbid', 'true');
      session.setItem('visiCategoryANC', 'ANC');
      listen$.next('x');
      expect(component.ComorbidStatus).toBe('false');
    });
  });

  it('adds a row when master data arrives (edit mode)', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ comorbidConditions: C });
    expect(component.comorbidityMasterData).toBe(C);
    expect(list().length).toBe(1);
    expect(component.comorbiditySelectList[0].length).toBe(5);
    expect(spy).not.toHaveBeenCalled();
    expect(component.getcomorbidityConcurrentConditions()?.length).toBe(1);
  });

  it('loads history in view mode', () => {
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ comorbidConditions: C });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ comorbidConditions: C });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('getcomorbidityConcurrentConditions returns null without FormArray', () => {
    component.comorbidityConcurrentConditionsForm = new FormGroup({});
    expect(component.getcomorbidityConcurrentConditions()).toBeNull();
  });


  describe('addComorbidityConcurrentConditions', () => {
    beforeEach(() => (component.comorbidityFilteredMasterData = C));

    it('excludes None and selected conditions for later rows', () => {
      component.addComorbidityConcurrentConditions();
      list().at(0).patchValue({ comorbidConditions: C[0] });
      component.addComorbidityConcurrentConditions();
      expect(
        component.comorbiditySelectList[1].map((c: any) => c.comorbidCondition),
      ).toEqual(['Asthma', 'Other', 'Nil']);
    });

    it('keeps Other available', () => {
      component.addComorbidityConcurrentConditions();
      list().at(0).patchValue({ comorbidConditions: C[3] });
      component.addComorbidityConcurrentConditions();
      expect(component.comorbiditySelectList[1]).toContain(C[3]);
    });

    it('adds no options without master data', () => {
      component.comorbidityFilteredMasterData = null;
      component.addComorbidityConcurrentConditions();
      expect(component.comorbiditySelectList.length).toBe(0);
      expect(list().length).toBe(1);
    });
  });


  describe('filterComorbidityConcurrentConditionsType', () => {
    beforeEach(() => {
      component.comorbidityFilteredMasterData = C;
      component.addComorbidityConcurrentConditions();
      component.addComorbidityConcurrentConditions();
    });


    it('restores previously selected value to other rows; Other keeps text', () => {
      const row = list().at(0);
      component.filterComorbidityConcurrentConditionsType(C[0], 0, row);
      row.patchValue({ otherComorbidCondition: 'custom' });
      component.filterComorbidityConcurrentConditionsType(C[3], 0, row);
      expect(row.value.otherComorbidCondition).toBe('custom');
      expect(component.comorbiditySelectList[1]).toContain(C[0]);
      expect(component.comorbiditySelectList[1]).toContain(C[3]);
    });

    it('None removes other rows and disables fields', () => {
      component.addComorbidityConcurrentConditions();
      component.filterComorbidityConcurrentConditionsType(
        C[1],
        2,
        list().at(2),
      );
      const row = list().at(0);
      component.filterComorbidityConcurrentConditionsType(C[2], 0, row);
      expect(list().length).toBe(1);
      expect(component.comorbiditySelectList.length).toBe(1);
      expect(component.comorbiditySelectList[0]).toContain(C[1]);
      expect(row.get('timePeriodAgo')?.disabled).toBeTrue();
      expect(row.get('isForHistory')?.disabled).toBeTrue();
    });

    it('Nil disables fields', () => {
      const row = list().at(0);
      row.get('timePeriodAgo')?.enable();
      component.filterComorbidityConcurrentConditionsType(C[4], 0, row);
      expect(row.get('timePeriodAgo')?.disabled).toBeTrue();
      expect(row.get('timePeriodUnit')?.disabled).toBeTrue();
    });
  });



  describe('validateDuration', () => {
    let row: any;
    beforeEach(() => {
      fixture.detectChanges();
      component.addComorbidityConcurrentConditions();
      row = list().at(0);
      row.get('timePeriodAgo').enable();
      row.get('timePeriodUnit').enable();
    });

    it('accepts duration within age', () => {
      row.patchValue({ timePeriodAgo: 2, timePeriodUnit: 'Years' });
      component.validateDuration(row);
      expect(confirmation.alert).not.toHaveBeenCalled();
      expect(row.value.timePeriodAgo).toBe(2);
    });

    it('alerts and clears duration greater than age', () => {
      row.patchValue({ timePeriodAgo: 40, timePeriodUnit: 'Years' });
      component.validateDuration(row);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.durationGreaterThanAge,
      );
      expect(row.get('timePeriodAgo').value).toBeNull();
      expect(row.get('timePeriodUnit').value).toBeNull();
    });

    it('enables unit when only duration given', () => {
      row.get('timePeriodUnit').disable();
      row.patchValue({ timePeriodAgo: 3 });
      component.validateDuration(row);
      expect(row.get('timePeriodUnit').enabled).toBeTrue();
    });

    it('disables unit when no duration', () => {
      row.patchValue({ timePeriodAgo: null, timePeriodUnit: 'Days' });
      component.validateDuration(row);
      expect(row.get('timePeriodUnit').disabled).toBeTrue();
    });
  });

  it('sortComorbidityList sorts by condition', () => {
    const l = [
      { comorbidCondition: 'b' },
      { comorbidCondition: 'a' },
      { comorbidCondition: 'a' },
    ];
    component.sortComorbidityList(l);
    expect(l.map((x) => x.comorbidCondition)).toEqual(['a', 'a', 'b']);
  });

  it('checkValidity is false only when all fields set', () => {
    component.addComorbidityConcurrentConditions();
    const row: any = list().at(0);
    expect(component.checkValidity(row)).toBeTrue();
    row.get('timePeriodAgo').enable();
    row.get('timePeriodUnit').enable();
    row.patchValue({
      comorbidConditions: C[0],
      timePeriodAgo: 1,
      timePeriodUnit: 'Years',
    });
    expect(component.checkValidity(row)).toBeFalse();
  });




  it('ngOnDestroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
