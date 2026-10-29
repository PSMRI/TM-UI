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
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { DoctorService } from '../../../shared/services';
import { ExaminationCaseSheetComponent } from './examination-case-sheet.component';

describe('ExaminationCaseSheetComponent', () => {
  let component: ExaminationCaseSheetComponent;
  let http: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ExaminationCaseSheetComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(ExaminationCaseSheetComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    http.getLanguage = jasmine.createSpy('getLanguage');
    return fixture;
  }

  beforeEach(() => spyOn(console, 'log'));

  it('ngOnInit reads visit context from session storage', () => {
    setup({
      caseSheetVisitCategory: 'General OPD',
      beneficiaryRegID: 5,
      visitID: 9,
    });
    component.ngOnInit();
    expect(component.visitCategory).toBe('General OPD');
    expect(component.beneficiaryRegID).toBe(5);
    expect(component.visitID).toBe(9);
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });


  it('ngOnChanges leaves sections undefined when examination is empty', () => {
    setup();
    component.casesheetData = { nurseData: { examination: {} } };
    component.ngOnChanges();
    expect(component.generalExamination).toBeUndefined();
    expect(component.gastroIntestinalExamination).toBeUndefined();
  });


  it('ngOnChanges handles refer without a service list', () => {
    setup();
    component.casesheetData = { doctorData: { Refer: {} } };
    component.ngOnChanges();
    expect(component.referDetails).toEqual({});
    expect(component.serviceList).toBe('');
  });

  it('ngOnChanges does nothing without data', () => {
    setup();
    component.casesheetData = undefined;
    component.ngOnChanges();
    expect(component.referDetails).toBeUndefined();
  });

  it('renders with data', () => {
    const fixture = setup();
    component.casesheetData = {
      nurseData: { examination: { generalExamination: {} } },
      doctorData: { Refer: {} },
    };
    component.ngOnChanges();
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('padLeft zero-pads single digit numbers', () => {
    setup();
    expect(component.padLeft.apply(5 as any)).toBe('05');
    expect(String(component.padLeft.apply(12 as any))).toBe('12');
  });
  describe('language', () => {
    beforeEach(() => setup({ currentLanguageSet: { fromSession: true } }));

    it('ngOnInit assigns the language set from the service', () => {
      component.ngOnInit();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });





  });
});
