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
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { ObstetricHistoryComponent } from './obstetric-history.component';
import { NurseService } from '../../../shared/services/nurse.service';
import { MasterdataService } from '../../../shared/services/masterdata.service';
import { CancerUtils } from '../../../shared/utility/cancer-utility';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('ObstetricHistoryComponent', () => {
  let component: ObstetricHistoryComponent;
  let fixture: ComponentFixture<ObstetricHistoryComponent>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let masterData$: BehaviorSubject<any>;
  let benDetails$: BehaviorSubject<any>;
  const info = LANGUAGE_EN.alerts.info;
  const ev = (value: any) => ({ target: { value } });

  beforeEach(async () => {
    nurseService = autoSpy(NurseService);
    masterData$ = new BehaviorSubject<any>(null);
    benDetails$ = new BehaviorSubject<any>({ ageVal: 45 });

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ObstetricHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 22,
            serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
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
      .overrideTemplate(ObstetricHistoryComponent, '')
      .compileComponents();

    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    fixture = TestBed.createComponent(ObstetricHistoryComponent);
    component = fixture.componentInstance;
    component.cancerPatientObstetricHistoryForm = new CancerUtils(
      TestBed.inject(FormBuilder),
      TestBed.inject(SessionStorageService),
    ).createCancerPatientObstetricHistoryForm();
    fixture.detectChanges();
  });

  const form = () => component.cancerPatientObstetricHistoryForm;

  it('sets language, master data and patient age on init', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.patientAge).toBe(45);
    masterData$.next({ m: 1 });
    expect(component.templateNurseMasterData).toEqual({ m: 1 });
    component.currentLanguageSet = undefined;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('ngOnChanges copies the pregnancy status when provided', () => {
    component.ngOnChanges();
    expect(component.pregnancyStatus).toBeNull();
    component.ispregnant = 'Yes';
    component.ngOnChanges();
    expect(component.pregnancyStatus).toBe('Yes');
  });

  it('ngOnDestroy unsubscribes from master data', () => {
    const sub = component.nurseMasterDataSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
  });

  it('clears dependent fields', () => {
    form().patchValue({ isUrinePregTest: 'Yes', noOfLivingChild: 2, isAbortion: 'No' });
    component.checkWithPregnancy();
    component.checkWithPregnantTimes();
    expect(form().value.isUrinePregTest).toBeNull();
    expect(form().value.noOfLivingChild).toBeNull();
    expect(form().value.isAbortion).toBeNull();
  });

  describe('checkNoOfChildren', () => {
    it('accepts a sensible count', () => {
      form().patchValue({ noOfLivingChild: 3 });
      component.checkNoOfChildren(3);
      expect(component.noOfLivingChild).toBe(3);
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('rejects more than 15 children with an alert', () => {
      form().patchValue({ noOfLivingChild: 16 });
      component.checkNoOfChildren(16);
      expect(component.noOfLivingChild).toBeNull();
      expect(confirmation.alert).toHaveBeenCalledWith(info.childObstericHistory);
    });

    it('clears zero silently', () => {
      form().patchValue({ noOfLivingChild: 0 });
      component.checkNoOfChildren(0);
      expect(component.noOfLivingChild).toBeNull();
      expect(confirmation.alert).not.toHaveBeenCalled();
    });
  });

  describe('checkLengthMenstrualCycle', () => {
    it('asks to recheck values outside 25-40', () => {
      component.checkLengthMenstrualCycle(ev(20));
      component.checkLengthMenstrualCycle(ev(41));
      component.checkLengthMenstrualCycle(ev(28));
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      expect(confirmation.alert).toHaveBeenCalledWith(info.recheckValue);
    });

    it('clears invalid lengths', () => {
      form().patchValue({ menstrualCycleLength: 0 });
      component.checkLengthMenstrualCycle(ev(0));
      expect(confirmation.alert).toHaveBeenCalledWith(info.invalidLength);
      expect(form().value.menstrualCycleLength).toBeNull();
    });
  });

  describe('checkMenstrualFlowDuration', () => {
    it('asks to recheck durations over 12 days', () => {
      component.checkMenstrualFlowDuration(ev(13));
      component.checkMenstrualFlowDuration(ev(5));
      expect(confirmation.alert).toHaveBeenCalledOnceWith(info.recheckValue);
    });

    it('clears invalid durations', () => {
      form().patchValue({ menstrualFlowDuration: -1 });
      component.checkMenstrualFlowDuration(ev(-1));
      expect(confirmation.alert).toHaveBeenCalledWith(info.invalidLength);
      expect(form().value.menstrualFlowDuration).toBeNull();
    });
  });

  describe('checkMenarcheAge', () => {
    it('accepts 8-20 and asks to recheck outside that range', () => {
      component.checkMenarcheAge(ev(12));
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.checkMenarcheAge(ev(6));
      expect(confirmation.alert).toHaveBeenCalledWith(info.recheckValue);
    });

    it('rejects an age above the patient age', () => {
      form().patchValue({ menarche_Age: 50 });
      component.checkMenarcheAge(ev(50));
      expect(form().value.menarche_Age).toBeNull();
      expect(confirmation.alert).toHaveBeenCalledWith(info.menarchAge);
    });

    it('rejects zero', () => {
      component.checkMenarcheAge(ev(0));
      expect(confirmation.alert).toHaveBeenCalledWith(info.invalidAge);
    });
  });

  describe('checkMenopauseAge', () => {
    beforeEach(() => (component.patientAge = 70));

    it('accepts 50-60 and keeps post-menopause bleeding', () => {
      form().patchValue({ isPostMenopauseBleeding: 'No' });
      component.checkMenopauseAge(ev(55));
      expect(form().value.isPostMenopauseBleeding).toBe('No');
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('asks to recheck outside 50-60 and clears bleeding', () => {
      form().patchValue({ isPostMenopauseBleeding: 'No' });
      component.checkMenopauseAge(ev(45));
      expect(form().value.isPostMenopauseBleeding).toBeNull();
      expect(confirmation.alert).toHaveBeenCalledWith(info.recheckValue);
    });

    it('rejects an age above the patient age', () => {
      form().patchValue({ menopauseAge: 75 });
      component.checkMenopauseAge(ev(75));
      expect(component.menopauseAge).toBeNull();
      expect(confirmation.alert).toHaveBeenCalledWith(info.menopauseAge);
    });

    it('rejects zero', () => {
      form().patchValue({ menopauseAge: 0 });
      component.checkMenopauseAge(ev(0));
      expect(component.menopauseAge).toBeNull();
      expect(confirmation.alert).toHaveBeenCalledWith(info.invalidAge);
    });
  });

  describe('getPreviousCancerPastObstetricHistory', () => {
    it('opens previous details when there is history', () => {
      const data = { data: [{ x: 1 }] };
      nurseService.getPreviousCancerPastObstetricHistory.and.returnValue(
        of({ data }),
      );
      component.getPreviousCancerPastObstetricHistory();
      expect(
        nurseService.getPreviousCancerPastObstetricHistory,
      ).toHaveBeenCalledWith(22);
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title: LANGUAGE_EN.historyData.familyhistory.previousfamilyhistory,
        },
      });
    });

    it('alerts when there is no previous history', () => {
      nurseService.getPreviousCancerPastObstetricHistory.and.returnValue(
        of({ data: { data: [] } }),
      );
      component.getPreviousCancerPastObstetricHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.previousHistoryDetailsAlert.prevHabitDiet,
      );
    });

    it('alerts errors', () => {
      nurseService.getPreviousCancerPastObstetricHistory.and.returnValue(
        of({ data: null, errorMessage: 'bad' }),
      );
      component.getPreviousCancerPastObstetricHistory();
      nurseService.getPreviousCancerPastObstetricHistory.and.returnValue(
        throwingObs('down'),
      );
      component.getPreviousCancerPastObstetricHistory();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
    });
  });

  it('exposes pregnant_No', () => {
    form().patchValue({ pregnant_No: '2' });
    expect(component.pregnant_No).toBe('2');
  });
});
