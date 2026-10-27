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

import { MenstrualHistoryComponent } from './menstrual-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
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

const MASTER = {
  menstrualCycleStatus: [
    { name: 'Active', menstrualCycleStatusID: 1 },
    { name: 'Amenorrhea', menstrualCycleStatusID: 2 },
  ],
  menstrualCycleLengths: [{ menstrualCycleRange: '21-35 days' }],
  menstrualCycleBloodFlowDuration: [{ menstrualCycleRange: '3-5 days' }],
  menstrualProblem: [{ problemName: 'None' }, { problemName: 'Dysmenorrhea' }],
};

function buildForm() {
  return new FormGroup({
    menstrualCycleStatus: new FormControl(null),
    menstrualCycleStatusID: new FormControl(null),
    regularity: new FormControl(null),
    cycleLength: new FormControl(null),
    menstrualCyclelengthID: new FormControl(null),
    menstrualFlowDurationID: new FormControl(null),
    bloodFlowDuration: new FormControl(null),
    menstrualProblemID: new FormControl(null),
    problemName: new FormControl(null),
    menstrualProblemList: new FormControl([]),
    lMPDate: new FormControl(null),
  });
}

describe('MenstrualHistoryComponent', () => {
  let component: MenstrualHistoryComponent;
  let fixture: ComponentFixture<MenstrualHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;
  let tracking: any;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [MenstrualHistoryComponent],
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
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(MenstrualHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(MenstrualHistoryComponent);
    component = fixture.componentInstance;
    component.menstrualHistoryForm = buildForm();
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
  });

  it('initialises language and LMP date bounds', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.today instanceof Date).toBeTrue();
    const diff = component.today.getTime() - component.minimumLMPDate.getTime();
    expect(diff).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it('ignores incomplete master data', () => {
    fixture.detectChanges();
    masterData$.next({ menstrualCycleStatus: [] });
    expect(component.masterData).toBeUndefined();
  });



  it('loads history in view mode', () => {
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(spy).toHaveBeenCalledTimes(1);
  });







  it('ngOnDestroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
