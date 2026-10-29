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

import { PerinatalHistoryComponent } from './perinatal-history.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
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

const DELIVERY_TYPES = [
  { deliveryTypeID: 1, deliveryType: 'Normal Delivery' },
  { deliveryTypeID: 2, deliveryType: 'Cesarean Section (LSCS)' },
  { deliveryTypeID: 3, deliveryType: 'Assisted Delivery' },
];
const MASTER = {
  deliveryTypes: DELIVERY_TYPES,
  deliveryPlaces: [
    { deliveryPlaceID: 1, deliveryPlace: 'PHC' },
    { deliveryPlaceID: 2, deliveryPlace: 'Home-Supervised' },
  ],
  birthComplications: [{ complicationID: 5, complicationAtBirth: 'Asphyxia' }],
};

describe('PerinatalHistoryComponent', () => {
  let component: PerinatalHistoryComponent;
  let fixture: ComponentFixture<PerinatalHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PerinatalHistoryComponent],
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
      .overrideTemplate(PerinatalHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PerinatalHistoryComponent);
    component = fixture.componentInstance;
    component.perinatalHistoryForm = new FormGroup({
      placeOfDelivery: new FormControl(null),
      otherPlaceOfDelivery: new FormControl(null),
      typeOfDelivery: new FormControl(null),
      complicationAtBirth: new FormControl(null),
      otherComplicationAtBirth: new FormControl(null),
      birthWeightG: new FormControl(null),
    });
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
  });

  it('initialises language and ignores empty master data', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.masterData).toBeUndefined();
  });

  it('stores master data and delivery types (edit mode)', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(component.selectDeliveryTypes).toEqual(DELIVERY_TYPES);
    expect(spy).not.toHaveBeenCalled();
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


  describe('resetOtherPlaceOfDelivery', () => {
    beforeEach(() => {
      fixture.detectChanges();
      masterData$.next(MASTER);
    });

    ['Home-Supervised', 'Home-Unsupervised'].forEach((place) =>
      it(`allows only normal delivery for ${place}`, () => {
        component.perinatalHistoryForm.patchValue({
          placeOfDelivery: { deliveryPlace: place },
        });
        component.resetOtherPlaceOfDelivery();
        expect(component.selectDeliveryTypes).toEqual([DELIVERY_TYPES[0]]);
        expect(
          component.perinatalHistoryForm.value.otherPlaceOfDelivery,
        ).toBeNull();
        expect(
          component.perinatalHistoryForm.get('typeOfDelivery')?.enabled,
        ).toBeTrue();
      }),
    );


    it('disables type of delivery when place is empty', () => {
      component.perinatalHistoryForm.patchValue({ placeOfDelivery: {} });
      component.resetOtherPlaceOfDelivery();
      expect(
        component.perinatalHistoryForm.get('typeOfDelivery')?.disabled,
      ).toBeTrue();
    });
  });

  it('getters and resetOtherComplicationAtBirth', () => {
    component.perinatalHistoryForm.patchValue({
      complicationAtBirth: { id: 1 },
      otherComplicationAtBirth: 'y',
    });
    expect(component.complicationAtBirth).toEqual({ id: 1 });
    component.resetOtherComplicationAtBirth();
    expect(
      component.perinatalHistoryForm.value.otherComplicationAtBirth,
    ).toBeNull();
  });



  it('ngOnDestroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
