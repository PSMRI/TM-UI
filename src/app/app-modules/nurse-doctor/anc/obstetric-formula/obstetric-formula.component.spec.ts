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
import { SimpleChange } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { MasterdataService } from '../../shared/services';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { ObstetricFormulaComponent } from './obstetric-formula.component';

describe('ObstetricFormulaComponent', () => {
  let component: ObstetricFormulaComponent;
  let fixture: ComponentFixture<ObstetricFormulaComponent>;
  let form: FormGroup;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let hrp: any;
  let confirm: any;

  const gravidaChange = { gravidaStatus: new SimpleChange(null, true, false) };

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [ObstetricFormulaComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: master$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ObstetricFormulaComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock({
        serviceLineDetails: JSON.stringify({
          facilityID: 1,
          parkingPlaceID: 2,
        }),
      }) as any,
    ).createObstetricFormulaForm();
    component.obstetricFormulaForm = form;
    fixture.detectChanges();
  });


  describe('master data and beneficiary blood group', () => {

    it('does not disable for "Don\'t Know"', () => {
      master$.next({ bloodGroups: [] });
      ben$.next({ bloodGroup: "Don't Know" });
      expect(component.disableBloodGroup).toBeFalse();
      expect(form.value.bloodGroup).toBe("Don't Know");
    });

    it('ignores beneficiary details without a blood group', () => {
      master$.next({ bloodGroups: [] });
      ben$.next({ ageVal: 20 });
      expect(form.value.bloodGroup).toBeNull();
    });

    it('ignores beneficiary blood group in view/update mode', () => {
      component.mode = 'view';
      master$.next({ bloodGroups: [] });
      ben$.next({ bloodGroup: 'O+' });
      expect(form.value.bloodGroup).toBeNull();
      expect(component.disableBloodGroup).toBeFalse();
    });
  });

  describe('ngOnChanges', () => {


    it('ignores unrelated changes', () => {
      form.patchValue({ gravida_G: 7 });
      component.ngOnChanges({});
      expect(form.value.gravida_G).toBe(7);
    });
  });

  describe('calculateGravida', () => {
    it('defaults to 1 with no para or abortions', () => {
      component.calculateGravida();
      expect(component.gravida_G).toBe(1);
    });

    it('alerts when abortions exceed 5', () => {
      form.patchValue({ abortions_A: 6 });
      component.calculateGravida('abortions_A');
      expect(component.gravida_G).toBe(7);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.recheckValue,
      );
    });

    it('alerts when still births exceed 9', () => {
      form.patchValue({ stillBirth: 10 });
      component.calculateGravida('stillBirth');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.recheckValue,
      );
    });

    it('does not alert for in-range values', () => {
      form.patchValue({ stillBirth: 2, abortions_A: 2 });
      component.calculateGravida('stillBirth');
      component.calculateGravida('abortions_A');
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  it('checkLivingChildren alerts above 9 only', () => {
    component.checkLivingChildren(9);
    expect(confirm.alert).not.toHaveBeenCalled();
    component.checkLivingChildren(10);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.recheckValue,
    );
  });

  it('checkAbortions alerts above 5 only', () => {
    component.checkAbortions(5);
    expect(confirm.alert).not.toHaveBeenCalled();
    component.checkAbortions(6);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.valueRange,
    );
  });



});
