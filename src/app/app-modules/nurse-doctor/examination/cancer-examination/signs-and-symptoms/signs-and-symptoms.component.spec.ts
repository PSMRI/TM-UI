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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

import { SignsAndSymptomsComponent } from './signs-and-symptoms.component';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { CancerUtils } from '../../../shared/utility/cancer-utility';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('SignsAndSymptomsComponent', () => {
  let component: SignsAndSymptomsComponent;
  let fixture: ComponentFixture<SignsAndSymptomsComponent>;
  let benDetails$: BehaviorSubject<any>;
  let utils: CancerUtils;

  beforeEach(async () => {
    benDetails$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SignsAndSymptomsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
          },
        }),
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(SignsAndSymptomsComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    utils = new CancerUtils(
      TestBed.inject(FormBuilder),
      TestBed.inject(SessionStorageService),
    );
    fixture = TestBed.createComponent(SignsAndSymptomsComponent);
    component = fixture.componentInstance;
    component.signsForm = utils.createSignsForm();
    fixture.detectChanges();
  });

  it('sets the language on init and on ngDoCheck', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('beneficiary details', () => {
    it('defaults every flag to false', () => {
      expect(component.female).toBeFalse();
      expect(component.female18).toBeFalse();
      expect(component.female30).toBeFalse();
    });

    it('flags adult women by age band', () => {
      benDetails$.next({ genderName: 'Female', ageVal: 20 });
      expect(component.female).toBeTrue();
      expect(component.female18).toBeTrue();
      expect(component.female30).toBeFalse();

      benDetails$.next({ genderName: 'female', ageVal: 30 });
      expect(component.female30).toBeTrue();
    });

    it('treats transgender as female but not for age-based screening', () => {
      benDetails$.next({ genderName: 'Transgender', ageVal: 40 });
      expect(component.female).toBeTrue();
      expect(component.female18).toBeFalse();
      expect(component.female30).toBeFalse();
    });

    it('resets the flags for male beneficiaries', () => {
      benDetails$.next({ genderName: 'Female', ageVal: 40 });
      benDetails$.next({ genderName: 'Male', ageVal: 40 });
      expect(component.female).toBeFalse();
      expect(component.female18).toBeFalse();
      expect(component.female30).toBeFalse();
    });
  });

  it('ngOnDestroy unsubscribes from beneficiary details', () => {
    const sub = component.beneficiaryDetailsSubs;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
  });

  describe('getLymphNodes', () => {
    it('returns the lymph node controls', () => {
      const nodes = component.getLymphNodes();
      expect(nodes?.length).toBe(utils.lymphNodesArray.length);
    });

    it('returns null when lymphNodes is not a FormArray', () => {
      component.signsForm = new FormGroup({});
      expect(component.getLymphNodes()).toBeNull();
    });
  });

  describe('checkLymph', () => {
    it('resets lymph node rows when nodes are not enlarged', () => {
      const nodes = component.signsForm.get('lymphNodes') as FormArray;
      nodes.at(0).setValue({ ...nodes.at(0).value, size_Left: '3cm' });

      component.checkLymph(false);

      expect(nodes.at(0).value.size_Left).toBeNull();
      expect(component.dataSource.data).toEqual(nodes.controls);
    });

    it('keeps entered rows when nodes are enlarged', () => {
      const nodes = component.signsForm.get('lymphNodes') as FormArray;
      nodes.at(0).setValue({ ...nodes.at(0).value, size_Left: '3cm' });

      component.checkLymph(true);

      expect(nodes.at(0).value.size_Left).toBe('3cm');
      expect(component.dataSource.data.length).toBe(nodes.length);
    });
  });

  it('exposes form values through getters', () => {
    component.signsForm.patchValue({ lymphNode_Enlarged: true });
    expect(component.observation).toBe(component.signsForm.get('observation'));
    expect(component.lymphNode_Enlarged).toBeTrue();
    expect(component.lymphNodes.length).toBe(utils.lymphNodesArray.length);
  });
});
