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
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { HistoryCaseSheetComponent } from './history-case-sheet.component';

const FULL = () => ({
  BeneficiaryData: { age: '30 years - 2 months' },
  nurseData: {
    anc: { ANCCareDetail: { lmp: 'x' } },
    history: {
      PastHistory: { pastIllness: [{ a: 1 }], pastSurgery: [{ b: 1 }] },
      FamilyHistory: { f: 1 },
      PhysicalActivityHistory: { p: 1 },
      childOptionalVaccineHistory: { childOptionalVaccineList: [{ v: 1 }] },
      ComorbidityConditions: {
        comorbidityConcurrentConditionsList: [{ c: 1 }],
      },
      MedicationHistory: { medicationHistoryList: [{ m: 1 }] },
      FemaleObstetricHistory: { fo: 1 },
      DevelopmentHistory: { d: 1 },
      FeedingHistory: { fe: 1 },
      MenstrualHistory: { me: 1 },
      PerinatalHistory: { pe: 1 },
      PersonalHistory: { ps: 1 },
      ImmunizationHistory: { im: 1 },
    },
  },
  doctorData: {
    Refer: {
      refrredToAdditionalServiceList: ['S1', null, 'S2'],
      referralReason: ['R1', 'R2'],
      revisitDate: '2024-03-05T00:00:00',
    },
  },
});

describe('HistoryCaseSheetComponent', () => {
  let component: HistoryCaseSheetComponent;
  let http: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HistoryCaseSheetComponent],
      providers: [...commonTestProviders({ session })],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(HistoryCaseSheetComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    http.getLanguage = jasmine.createSpy('getLanguage');
    return fixture;
  }

  beforeEach(() => spyOn(console, 'log'));


  it('keeps already formatted revisit date', () => {
    setup();
    component.caseSheetData = {
      doctorData: { Refer: { revisitDate: '05/03/2024' } },
    };
    component.ngOnChanges();
    expect(component.referDetails.revisitDate).toBe('05/03/2024');
    expect(component.serviceList).toBe('');
  });



  it('only sets date when no case sheet', () => {
    setup();
    component.caseSheetData = undefined;
    component.ngOnChanges();
    expect(component.date).toBeTruthy();
    expect(component.beneficiary).toBeUndefined();
  });



});
