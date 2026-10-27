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
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createHttpServiceMock,
  throwingObs,
} from 'src/testing/test-utils';
import { HttpServiceService } from '../../core/services/http-service.service';
import { PrintPageSelectComponent } from './print-page-select.component';

describe('PrintPageSelectComponent', () => {
  let component: PrintPageSelectComponent;
  let fixture: ComponentFixture<PrintPageSelectComponent>;
  let http: any;

  const allKeys = [
    'caseSheetANC',
    'caseSheetPNC',
    'caseSheetHistory',
    'caseSheetExamination',
    'caseSheetPrescription',
    'caseSheetDiagnosis',
    'caseSheetInvestigations',
    'caseSheetExtInvestigation',
    'caseSheetCurrentVitals',
    'caseSheetChiefComplaints',
    'caseSheetClinicalObservations',
    'caseSheetFindings',
    'caseSheetCovidVaccinationDetails',
    'caseSheetNCDScreeningDetails',
    'caseSheetFamilyPlanning',
    'caseSheetVisitDetails',
    'caseSheetTreatmentOnSideEffects',
    'caseSheetCounsellingProvided',
    'caseSheetNeonatalAndInfant',
    'caseSheetOralVitaminA',
  ];
  const selection = (value: boolean, over: any = {}) => {
    const o: any = {};
    allKeys.forEach((k) => (o[k] = value));
    return { ...o, ...over };
  };

  const create = async (data: any) => {
    http = createHttpServiceMock();
    (http as any).getLanguage = jasmine
      .createSpy('getLanguage')
      .and.returnValue(of({ English: LANGUAGE_EN }));
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PrintPageSelectComponent],
      providers: [
        ...commonTestProviders(),
        { provide: HttpServiceService, useValue: http },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    // Template uses [(ngModel)] on mat-checkbox (no value accessor without MatCheckboxModule).
    TestBed.overrideTemplate(PrintPageSelectComponent, '');
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(PrintPageSelectComponent);
    component = fixture.componentInstance;
  };

  beforeEach(() => sessionStorage.setItem('setLanguage', 'English'));
  afterEach(() => sessionStorage.removeItem('setLanguage'));

  describe('init', () => {




    it('ngDoCheck assigns the language set', async () => {
      await create(null);
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

  });


});
