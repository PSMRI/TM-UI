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
import { BehaviorSubject, of, Subject } from 'rxjs';

import { TravelHistoryComponent } from './travel-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('TravelHistoryComponent', () => {
  let component: TravelHistoryComponent;
  let fixture: ComponentFixture<TravelHistoryComponent>;
  let doctor: any;
  let nurse: any;
  let session: any;
  let http: any;
  let masterData$: BehaviorSubject<any>;
  let masterListen$: Subject<any>;

  const RECOMMENDATIONS = Array.from({ length: 15 }, (_, i) => ({
    CovidrecommendationID: i + 1,
    recommendation: `R${i + 1}`,
  }));

  function buildForm(): FormGroup {
    const fb = new FormBuilder();
    return fb.group({
      travelStatus: [null],
      travelList: fb.array([]),
      recommendation: fb.array([]),
      suspectedStatusUI: [null],
      modeOfTravelDomestic: [null],
      fromStateDom: [null],
      fromDistrictDom: [null],
      fromSubDistrictDom: [null],
      toStateDom: [null],
      toDistrictDom: [null],
      toSubDistrictDom: [null],
      modeOfTravelInter: [null],
      fromCountryInter: [null],
      fromCityInter: [null],
      toCountryInter: [null],
      toCityInter: [null],
    });
  }

  async function setup(seed: Record<string, any> = {}) {
    masterData$ = new BehaviorSubject<any>({
      covidRecommendationMaster: RECOMMENDATIONS,
    });
    masterListen$ = new Subject<any>();
    const masterMock: any = autoSpy(MasterdataService, {
      nurseMasterData$: masterData$,
    });
    masterMock.listen.and.returnValue(masterListen$);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [TravelHistoryComponent],
      providers: [
        ...commonTestProviders({ session: seed }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: MasterdataService, useValue: masterMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(TravelHistoryComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(TravelHistoryComponent);
    component = fixture.componentInstance;
    component.patientCovidForm = buildForm();
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    http = TestBed.inject(HttpServiceService) as any;
    nurse.getCountryName.and.returnValue(
      of({ statusCode: 200, data: [{ countryID: 1 }] }),
    );
    nurse.getStateName.and.returnValue(
      of({ statusCode: 200, data: [{ stateID: 5 }] }),
    );
    nurse.getCityName.and.returnValue(
      of({ statusCode: 200, data: [{ cityID: 9 }] }),
    );
    nurse.getDistrictName.and.returnValue(
      of({ statusCode: 200, data: [{ districtID: 3 }] }),
    );
    nurse.getSubDistrictName.and.returnValue(
      of({ statusCode: 200, data: [{ blockID: 4 }] }),
    );
  }

  const recIds = () =>
    (component.patientCovidForm.controls['recommendation'] as FormArray)
      .value[0];

  describe('default', () => {
    beforeEach(async () => {
      await setup({ visitID: 'V1', beneficiaryRegID: 'B1' });
      fixture.detectChanges();
    });




    describe('getrecommendedtext combinations', () => {
      const table: {
        q: string;
        s: string | null;
        c: string | null;
        all?: string;
        status: string | null;
        ids: string[];
      }[] = [
        {
          q: 'yes',
          s: 'true',
          c: 'true',
          status: 'YES',
          ids: ['R1', 'R2', 'R3', 'R4', 'R5'],
        },
        {
          q: 'yes',
          s: 'true',
          c: 'false',
          status: 'YES',
          ids: ['R1', 'R2', 'R3', 'R4', 'R5'],
        },
        {
          q: 'no',
          s: 'true',
          c: 'true',
          status: 'YES',
          ids: ['R1', 'R2', 'R3', 'R4', 'R5'],
        },
        {
          q: 'no',
          s: 'false',
          c: 'true',
          status: 'YES',
          ids: ['R6', 'R7', 'R8', 'R9', 'R10', 'R11'],
        },
        {
          q: 'yes',
          s: 'false',
          c: 'true',
          status: 'YES',
          ids: ['R6', 'R7', 'R8', 'R9', 'R10', 'R11'],
        },
        {
          q: 'yes',
          s: 'false',
          c: 'false',
          status: 'YES',
          ids: ['R11', 'R12', 'R13'],
        },
        { q: 'no', s: 'true', c: 'false', status: 'NO', ids: ['R5', 'R14'] },
        { q: 'no', s: 'false', c: 'false', status: 'NO', ids: ['R11', 'R15'] },
        {
          q: 'x',
          s: 'null',
          c: 'null',
          all: 'true',
          status: 'YES',
          ids: ['R1', 'R2', 'R3', 'R4', 'R5'],
        },
      ];
      table.forEach((t) => {
        it(`q=${t.q} symptom=${t.s} contact=${t.c} all=${t.all}`, () => {
          session.setItem('symptom', t.s);
          session.setItem('contact', t.c);
          session.setItem('allSymptom', t.all ?? 'false');
          component.question1 = t.q;
          component.getrecommendedtext();
          expect(component.suspectedStatusUI).toBe(t.status);
          expect(recIds()).toEqual(t.ids);
          expect(component.recommendationText).toBe(t.ids.join('\n'));
          expect(component.travelReqiured).toBe(
            t.all === 'true' ? 'false' : 'true',
          );
        });
      });

    });












  });


});
