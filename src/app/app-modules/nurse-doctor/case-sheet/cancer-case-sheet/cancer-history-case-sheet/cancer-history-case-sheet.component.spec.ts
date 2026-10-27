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

import { CancerHistoryCaseSheetComponent } from './cancer-history-case-sheet.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('CancerHistoryCaseSheetComponent', () => {
  let component: CancerHistoryCaseSheetComponent;
  let fixture: ComponentFixture<CancerHistoryCaseSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerHistoryCaseSheetComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerHistoryCaseSheetComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(CancerHistoryCaseSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sets the language on init and on ngDoCheck', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('does nothing without case sheet data', () => {
    component.ngOnChanges();
    expect(component.beneficiaryDetails).toBeUndefined();
    expect(component.patientPersonalHistory).toBeUndefined();
  });

  it('maps beneficiary and nurse history data', () => {
    const diet = { dietType: 'Veg' };
    component.casesheetData = {
      BeneficiaryData: { name: 'A' },
      nurseData: {
        familyDiseaseHistory: [{ disease: 'X' }],
        benPersonalDietHistory: diet,
        patientPersonalHistory: { tobaccoUse: 'No' },
        patientObstetricHistory: { pregnancyStatus: 'No' },
      },
    };
    component.ngOnChanges();

    expect(component.beneficiaryDetails).toEqual({ name: 'A' });
    expect(component.familyDiseaseHistory).toEqual([{ disease: 'X' }]);
    expect(component.patientPersonalHistory).toEqual({
      dietType: 'Veg',
      tobaccoUse: 'No',
    });
    expect(diet).toEqual({ dietType: 'Veg' });
    expect(component.patientObstetricHistory).toEqual({
      pregnancyStatus: 'No',
    });
  });

  it('leaves sections unset when nurse data is missing', () => {
    component.casesheetData = { BeneficiaryData: { name: 'B' } };
    component.ngOnChanges();
    expect(component.beneficiaryDetails).toEqual({ name: 'B' });
    expect(component.familyDiseaseHistory).toBeUndefined();
    expect(component.patientObstetricHistory).toBeUndefined();
  });
});
