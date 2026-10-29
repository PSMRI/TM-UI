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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import { VisitDetailsComponent } from './visit-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('VisitDetailsComponent', () => {
  let component: VisitDetailsComponent;
  let fixture: ComponentFixture<VisitDetailsComponent>;
  let storage: any;

  const SUB_FORMS = [
    'covidVaccineStatusForm',
    'patientChiefComplaintsForm',
    'patientAdherenceForm',
    'patientInvestigationsForm',
    'patientCovidForm',
    'patientFileUploadDetailsForm',
    'patientDiseaseForm',
  ];

  async function setup(session: Record<string, any> = {}, mode?: string) {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [VisitDetailsComponent],
      providers: [...commonTestProviders({ session })],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(VisitDetailsComponent, '')
      .compileComponents();

    storage = TestBed.inject(SessionStorageService);
    fixture = TestBed.createComponent(VisitDetailsComponent);
    component = fixture.componentInstance;
    const controls: Record<string, FormGroup> = {
      patientVisitDetailsForm: new FormGroup({
        visitCategory: new FormControl(null),
      }),
    };
    SUB_FORMS.forEach((name) => (controls[name] = new FormGroup({})));
    component.patientVisitDataForm = new FormGroup(controls);
    component.mode = mode as any;
    fixture.detectChanges();
  }

  const selectCategory = (category: string | null) =>
    component.patientVisitDataForm
      .get('patientVisitDetailsForm.visitCategory')
      ?.setValue(category);

  describe('init', () => {
    beforeEach(() => setup());

    it('extracts the sub-forms and sets the language', () => {
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.patientVisitDetailsForm).toBe(
        component.patientVisitDataForm.get(
          'patientVisitDetailsForm',
        ) as FormGroup,
      );
      SUB_FORMS.forEach((name) =>
        expect((component as any)[name])
          .withContext(name)
          .toBe(component.patientVisitDataForm.get(name)),
      );
      component.current_language_set = undefined;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('ignores an empty category', () => {
      selectCategory(null);
      expect(component.visitCategory).toBeUndefined();
    });

    it('enables NCD screening and file selection', () => {
      selectCategory('NCD screening');
      expect(component.visitCategory).toBe('NCD screening');
      expect(component.showNcdScreeningVisit).toBeTrue();
      expect(component.enableFileSelection).toBeTrue();
      expect(storage.getItem('visiCategoryANC')).toBe('NCD screening');
    });

    const flags: [string, keyof VisitDetailsComponent][] = [
      ['ANC', 'showANCVisit'],
      ['NCD care', 'showNCDCare'],
      ['PNC', 'showPNC'],
      ['General OPD', 'showPNC'],
      ['COVID-19 Screening', 'showCOVID'],
    ];
    flags.forEach(([category, flag]) => {
      it(`shows ${String(flag)} for ${category}`, () => {
        selectCategory(category);
        expect(component[flag]).toBeTrue();
      });
    });

    it('resets every tab before applying a new category', () => {
      selectCategory('ANC');
      selectCategory('Cancer Screening');
      expect(component.showANCVisit).toBeFalse();
      expect(component.hideAll).toBeFalse();
      selectCategory('General OPD (QC)');
      selectCategory('Other');
      expect(component.showPNC).toBeFalse();
    });
  });

  it('keeps previous tabs in view mode', async () => {
    await setup({}, 'view');
    selectCategory('ANC');
    selectCategory('NCD care');
    expect(component.showANCVisit).toBeTrue();
    expect(component.showNCDCare).toBeTrue();
  });

  it('copies the specialist visit category for flag 100', async () => {
    await setup({ specialistFlag: '100', visitCat: 'ANC' });
    expect(storage.getItem('visitCategory')).toBe('ANC');
  });

  it('does not copy the category for other flags', async () => {
    await setup({ specialistFlag: '1', visitCat: 'ANC' });
    expect(storage.getItem('visitCategory')).toBeNull();
  });
});
