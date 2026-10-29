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
import { MatDialog } from '@angular/material/dialog';

import { FeedingHistoryComponent } from './feeding-history.component';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('FeedingHistoryComponent', () => {
  let component: FeedingHistoryComponent;
  let fixture: ComponentFixture<FeedingHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FeedingHistoryComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'B1' } }),
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$.asObservable(),
          }),
        },
        { provide: NurseService, useValue: autoSpy(NurseService) },
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
      .overrideTemplate(FeedingHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(FeedingHistoryComponent);
    component = fixture.componentInstance;
    component.feedingHistoryForm = new FormGroup({
      compFeedStartAge: new FormControl(null),
      noOfCompFeedPerDay: new FormControl(null),
      foodIntoleranceStatus: new FormControl(null),
      typeOfFoodIntolerances: new FormControl(null),
      otherFoodIntolerance: new FormControl(null),
    });
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
  });

  it('initialises language and ignores empty master data', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.masterData).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it('stores master data without loading history in edit mode', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    component.mode = 'edit';
    fixture.detectChanges();
    masterData$.next({ foodIntoleranceStatus: ['Milk'] });
    expect(component.masterData).toEqual({ foodIntoleranceStatus: ['Milk'] });
    expect(spy).not.toHaveBeenCalled();
  });

  it('loads history in view mode', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    component.mode = 'view';
    fixture.detectChanges();
    masterData$.next({});
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({});
    expect(spy).toHaveBeenCalledTimes(1);
  });


  describe('beneficiary age in months', () => {
    beforeEach(() => fixture.detectChanges());

    it('computes months from years and months', () => {
      beneficiary$.next({ age: '1 years - 3 months' });
      expect(component.age).toBe(15);
    });

    it('computes months from months only', () => {
      beneficiary$.next({ age: '5 months - 2 days' });
      expect(component.age).toBe(5);
    });

    it('keeps 0 for days only', () => {
      beneficiary$.next({ age: '5 days' });
      expect(component.age).toBe(0);
    });

    it('ignores beneficiary without age', () => {
      beneficiary$.next({ age: null });
      expect(component.age).toBe(0);
    });
  });


  it('getters expose form values', () => {
    component.feedingHistoryForm.patchValue({
      compFeedStartAge: 6,
      foodIntoleranceStatus: 'Yes',
    });
    expect(component.compFeedStartAge).toBe(6);
    expect(component.foodIntoleranceStatus).toBe('Yes');
  });

  it('resetNoOfCompFeedPerDay clears the value', () => {
    component.feedingHistoryForm.patchValue({ noOfCompFeedPerDay: 3 });
    component.resetNoOfCompFeedPerDay();
    expect(component.feedingHistoryForm.value.noOfCompFeedPerDay).toBeNull();
  });





  it('ngOnDestroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
