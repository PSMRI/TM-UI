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
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { CaseRecordComponent } from './case-record.component';
import { DoctorService } from '../shared/services/doctor.service';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('CaseRecordComponent', () => {
  let component: CaseRecordComponent;
  let fixture: ComponentFixture<CaseRecordComponent>;
  let doctorService: any;
  let routeParams: any;

  beforeEach(async () => {
    routeParams = { attendant: 'doctor' };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CaseRecordComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'V1', beneficiaryRegID: 'B1' },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get params() {
                return routeParams;
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseRecordComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService) as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  [
    'General OPD',
    'ANC',
    'NCD care',
    'PNC',
    'COVID-19 Screening',
    'NCD screening',
  ].forEach((cat) => {
    it(`shows general OPD case record for "${cat}"`, () => {
      component.visitCategory = cat;
      component.ngOnInit();
      expect(component.showGeneralOPD).toBeTrue();
    });
  });

  it('hides general OPD case record for other categories', () => {
    component.visitCategory = 'Cancer Screening';
    component.ngOnInit();
    expect(component.showGeneralOPD).toBeFalse();
  });

  it('keeps showGeneralOPD false when no visit category', () => {
    component.visitCategory = undefined as any;
    component.ngOnInit();
    expect(component.showGeneralOPD).toBeFalse();
  });


  it('does not fetch details for nurse', () => {
    routeParams = { attendant: 'nurse' };
    component.ngOnInit();
    expect(doctorService.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
  });

  [
    { statusCode: 5000, data: {} },
    { statusCode: 200, data: undefined },
    null,
  ].forEach((resp) => {
  });

});
