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

import { ImmunizationHistoryComponent } from './immunization-history.component';
import { DoctorService, MasterdataService } from '../../../shared/services';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

const v = (
  vaccinationTime: string,
  vaccineName: string,
  sctCode: any = null,
) => ({
  vaccinationTime,
  vaccineName,
  sctCode,
  sctTerm: sctCode ? 'term-' + vaccineName : null,
});
const VACCINES = [
  v('14 weeks', 'Pentavalent-3'),
  v('14 weeks', 'Rota Vaccine-3'),
  v('14 weeks', 'OPV-3'),
  v('14 weeks', 'fIPV-2'),
  v('14 weeks', 'PCV2'),
  v('Birth', 'BCG', '111'),
  v('Birth', 'OPV-0'),
  v('Birth', 'HBV-0'),
  v('6 weeks', 'Pentavalent-1'),
  v('6 weeks', 'Rota Vaccine-1'),
  v('6 weeks', 'OPV-1'),
  v('6 weeks', 'fIPV-1'),
  v('6 weeks', 'PCV1'),
  v('10 weeks', 'Pentavalent-2'),
  v('10 weeks', 'Rota Vaccine-2'),
  v('10 weeks', 'OPV-2'),
  v('9-12 months', 'MR-1'),
  v('5-6 years', 'DPT Booster-2'),
  v('16 years', 'TT'),
];

describe('ImmunizationHistoryComponent', () => {
  let component: ImmunizationHistoryComponent;
  let fixture: ComponentFixture<ImmunizationHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let session: any;

  const list = () =>
    component.immunizationHistoryForm.get('immunizationList') as FormArray;
  const group = (age: string) =>
    list().controls.find(
      (c) => c.value.defaultReceivingAge === age,
    ) as FormGroup;
  const vac = (age: string, name: string) =>
    (group(age).get('vaccines') as FormArray).controls.find(
      (c) => c.value.vaccine === name,
    ) as FormGroup;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({ age: '1 years - 2 months' });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ImmunizationHistoryComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$.asObservable(),
          }),
        },
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateHistoryResponse$: history$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ImmunizationHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ImmunizationHistoryComponent);
    component = fixture.componentInstance;
    component.immunizationHistoryForm = TestBed.inject(FormBuilder).group({
      immunizationList: new FormArray([]),
    });
    session = TestBed.inject(SessionStorageService);
  });

  const load = () => {
    fixture.detectChanges();
    masterData$.next({ childVaccinations: VACCINES });
  };

  describe('building the immunization list', () => {


    it('uses the year part only when months are zero', () => {
      ben$.next({ age: '2 years - 0 months' });
      load();
      expect(component.beneficiaryAge).toBe('2 years');
    });



    it('ignores master data without child vaccinations', () => {
      fixture.detectChanges();
      masterData$.next({});
      expect(list().length).toBe(0);
    });
  });


  describe('loading saved vaccine data', () => {
    const savedHistory = () => ({
      statusCode: 200,
      data: {
        ImmunizationHistory: {
          immunizationList: [
            { defaultReceivingAge: 'Birth', vaccines: [{ status: true }] },
            {
              defaultReceivingAge: '6 weeks',
              vaccines: [
                { status: true },
                { status: false },
                { status: true },
                { status: true },
                { status: true },
              ],
            },
          ],
        },
      },
    });


    it('loads for specialist flag 100', () => {
      session.setItem('specialistFlag', '100');
      const spy = spyOn(component, 'loadVaccineData');
      load();
      expect(spy).toHaveBeenCalled();
    });

    it('ignores history without immunization list', () => {
      component.mode = 'view';
      load();
      history$.next({ statusCode: 200, data: { ImmunizationHistory: {} } });
      expect(vac('Birth', 'BCG').value.status).toBeFalse();
    });
  });



  it('selectAll marks the list dirty', () => {
    load();
    component.selectAll(true, 0);
    expect(list().dirty).toBeTrue();
  });

  it('ngOnDestroy unsubscribes', () => {
    load();
    const a = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    const b = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
    component.nurseMasterDataSubscription = null;
    component.beneficiaryDetailSubscription = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck refreshes language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
