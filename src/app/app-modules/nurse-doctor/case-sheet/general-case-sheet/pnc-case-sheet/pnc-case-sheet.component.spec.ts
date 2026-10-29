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
import { PncCaseSheetComponent } from './pnc-case-sheet.component';

describe('PncCaseSheetComponent', () => {
  let component: PncCaseSheetComponent;
  let http: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PncCaseSheetComponent],
      providers: [...commonTestProviders({ session })],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(PncCaseSheetComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    http.getLanguage = jasmine.createSpy('getLanguage');
    return fixture;
  }

  beforeEach(() => spyOn(console, 'log'));

  it('ngOnChanges maps PNC care detail', () => {
    const fixture = setup();
    component.caseSheetData = {
      nurseData: { pnc: { PNCCareDetail: { d: 1 } } },
    };
    component.ngOnChanges();
    expect(component.pNCCaseSheetData).toEqual({ d: 1 });
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('ngOnChanges ignores data without PNC', () => {
    setup();
    component.caseSheetData = { nurseData: {} };
    component.ngOnChanges();
    component.caseSheetData = undefined;
    component.ngOnChanges();
    expect(component.pNCCaseSheetData).toBeUndefined();
  });

  describe('language', () => {
    beforeEach(() => setup({ currentLanguageSet: { fromSession: true } }));

    it('ngOnInit assigns the language set from the service', () => {
      component.ngOnInit();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });





  });
});
