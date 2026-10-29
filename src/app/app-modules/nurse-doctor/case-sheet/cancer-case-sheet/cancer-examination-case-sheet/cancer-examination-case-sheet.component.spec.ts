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

import { CancerExaminationCaseSheetComponent } from './cancer-examination-case-sheet.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('CancerExaminationCaseSheetComponent', () => {
  let component: CancerExaminationCaseSheetComponent;
  let fixture: ComponentFixture<CancerExaminationCaseSheetComponent>;

  const NURSE_DATA = {
    signsAndSymptoms: { cough: true },
    BenCancerLymphNodeDetails: [{ lymphNodeName: 'A' }],
    oralExamination: { o: 1 },
    breastExamination: { b: 1 },
    abdominalExamination: { a: 1 },
    gynecologicalExamination: { g: 1 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerExaminationCaseSheetComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerExaminationCaseSheetComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    fixture = TestBed.createComponent(CancerExaminationCaseSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sets the language on init and on ngDoCheck', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('sets today as the date even without data', () => {
    const t = new Date();
    component.ngOnChanges();
    expect(component.date).toBe(
      `${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()}`,
    );
    expect(component.diagnosisdetails).toBeUndefined();
  });

  it('maps nurse examination data and annotated images', () => {
    component.casesheetData = {
      BeneficiaryData: { name: 'A' },
      nurseData: NURSE_DATA,
      ImageAnnotatedData: [{ imageID: 3 }],
    };
    component.ngOnChanges();

    expect(component.beneficiaryDetails).toEqual({ name: 'A' });
    expect(component.signsAndSymptoms).toBe(NURSE_DATA.signsAndSymptoms);
    expect(component.BenCancerLymphNodeDetails).toBe(
      NURSE_DATA.BenCancerLymphNodeDetails,
    );
    expect(component.oralExamination).toBe(NURSE_DATA.oralExamination);
    expect(component.breastExamination).toBe(NURSE_DATA.breastExamination);
    expect(component.abdominalExamination).toBe(
      NURSE_DATA.abdominalExamination,
    );
    expect(component.gynecologicalExamination).toBe(
      NURSE_DATA.gynecologicalExamination,
    );
    expect(component.imageAnnotatedData).toEqual([{ imageID: 3 }]);
  });

  it('formats a non DD/MM/YYYY revisit date with zero padding', () => {
    component.casesheetData = {
      nurseData: NURSE_DATA,
      doctorData: { diagnosis: { revisitDate: '2026-03-05T12:00:00' } },
    };
    component.ngOnChanges();
    expect(component.diagnosisdetails.revisitDate).toBe('05/03/2026');
  });

  it('keeps a revisit date already in DD/MM/YYYY', () => {
    component.casesheetData = {
      nurseData: NURSE_DATA,
      doctorData: { diagnosis: { revisitDate: '15/11/2026' } },
    };
    component.ngOnChanges();
    expect(component.diagnosisdetails.revisitDate).toBe('15/11/2026');
  });

  it('padLeft pads to two characters and leaves longer values alone', () => {
    expect(component.padLeft.apply(7 as any)).toBe('07');
    expect(component.padLeft.apply(12 as any)).toBe('12');
    expect(component.padLeft.apply(2026 as any)).toBe(2026 as any);
  });

  it('getImageAnnotation returns the matching image or null', () => {
    component.imageAnnotatedData = [{ imageID: 1 }, { imageID: 2 }];
    expect(component.getImageAnnotation(2)).toEqual({ imageID: 2 });
    expect(component.getImageAnnotation(9)).toBeNull();
  });
});
