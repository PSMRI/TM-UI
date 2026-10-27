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
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { PatientVisitDetailsComponent } from './visit-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { VisitDetailUtils } from '../../shared/utility/visit-detail-utility';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

const CATS = [
  'General OPD',
  'ANC',
  'PNC',
  'NCD screening',
  'NCD care',
  'COVID-19 Screening',
  'Cancer Screening',
  'Synctest',
  'FP & Contraceptive Services',
  'Neonatal and Infant Health Care Services',
  'Childhood & Adolescent Healthcare Services',
  'General OPD (QC)',
];
const VISIT_MASTER = {
  visitReasons: [{ visitReason: 'Screening' }],
  visitCategories: CATS.map((c, i) => ({
    visitCategoryID: i,
    visitCategory: c,
  })),
};
const SUB_CATS = [
  'Newborn & Infant OPD care',
  'Child & Adolescent OPD care',
  'Reproductive Health OPD care',
  'Elderly OPD Health care',
  'Management of common communicable diseases and outpatient care for acute simple illnesses & minor ailments',
  'Other',
].map((name, id) => ({ id, name }));
const NURSE_MASTER = {
  subVisitCategories: SUB_CATS,
  m_fpmethodfollowup: ['Pills', 'Other'],
  m_FPSideEffects: ['Nausea', 'Other'],
};

const ADULT_F = {
  age: '35 years - 0 months',
  ageVal: 35,
  genderName: 'Female',
};
const SENIOR_F = {
  age: '65 years - 0 months',
  ageVal: 65,
  genderName: 'Female',
};
const CHILD_M = { age: '10 years - 3 months', ageVal: 10, genderName: 'Male' };
const INFANT_F = { age: '0 years - 5 months', ageVal: 0, genderName: 'Female' };

describe('PatientVisitDetailsComponent', () => {
  let component: PatientVisitDetailsComponent;
  let fixture: ComponentFixture<PatientVisitDetailsComponent>;
  let doctor: any;
  let nurse: any;
  let ncd: any;
  let session: any;
  let tracking: any;
  let visitMaster$: BehaviorSubject<any>;
  let nurseMaster$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let routeParams: any;
  let form: FormGroup;

  async function setup(
    opts: {
      session?: Record<string, any>;
      beneficiary?: any;
      mode?: string;
    } = {},
  ) {
    visitMaster$ = new BehaviorSubject<any>(VISIT_MASTER);
    nurseMaster$ = new BehaviorSubject<any>(NURSE_MASTER);
    ben$ = new BehaviorSubject<any>(opts.beneficiary ?? ADULT_F);
    routeParams = { attendant: 'nurse' };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [PatientVisitDetailsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            visitID: 'V1',
            beneficiaryRegID: 'B1',
            visitCode: 'VC1',
            ...(opts.session ?? {}),
          },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, { mmuVisitData: true }),
        },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            visitDetailMasterData$: visitMaster$,
            nurseMasterData$: nurseMaster$,
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$, cbacData: ['c'] },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: routeParams } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(PatientVisitDetailsComponent);
    component = fixture.componentInstance;
    component.mode = opts.mode as any;
    session = TestBed.inject(SessionStorageService) as any;
    form = new VisitDetailUtils(
      new FormBuilder(),
      session,
    ).createPatientVisitDetails(false);
    component.patientVisitDetailsForm = form;
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    ncd = {} as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
  }

  const names = () =>
    component.templateFilterVisitCategories.map((c: any) => c.visitCategory);

  describe('init (non-view)', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });














    it('ignores null visit master and null nurse master', () => {
      component.templateVisitReasons = undefined;
      visitMaster$.next(null);
      nurseMaster$.next(null);
      nurseMaster$.next({});
      expect(component.templateVisitReasons).toBeUndefined();
    });

  });

  describe('beneficiary-driven flags', () => {


    it('ignores null beneficiary', async () => {
      await setup({ beneficiary: null });
      ben$.next(null);
      component.getBenificiaryDetails();
      expect(component.beneficiary).toBeUndefined();
    });
  });



  describe('visit detail fetching', () => {
    const KEYS: [string, string][] = [
      ['General OPD (QC)', 'benVisitDetails'],
      ['ANC', 'ANCNurseVisitDetail'],
      ['General OPD', 'GOPDNurseVisitDetail'],
      ['NCD screening', 'NCDScreeningNurseVisitDetail'],
      ['NCD care', 'NCDCareNurseVisitDetail'],
      ['PNC', 'PNCNurseVisitDetail'],
      ['COVID-19 Screening', 'covid19NurseVisitDetail'],
      ['Neonatal and Infant Health Care Services', 'neonatalNurseVisitDetail'],
      ['Childhood & Adolescent Healthcare Services', 'cacNurseVisitDetail'],
      ['FP & Contraceptive Services', 'FP_NurseVisitDetail'],
    ];

    function response(key: string) {
      return of({
        statusCode: 200,
        data: {
          [key]: {
            fileIDs: [key],
            visitReason: 'Follow Up',
            visitCategory: 'X',
            followUpForFpMethod: ['Other'],
            sideEffects: ['Other'],
          },
        },
      });
    }

    KEYS.forEach(([cat, key]) => {

    });

    it('ignores non-200 responses', async () => {
      await setup({ session: { visitCategory: 'ANC' } });
      fixture.detectChanges();
      doctor.getVisitComplaintDetails.and.returnValue(of({ statusCode: 5000 }));
      component.getVisitDetails('V', 'B');
      component.getMMUVisitDetails('V', 'B');
      expect(component.disableVisit).toBeFalse();
      expect(doctor.fileIDs).toBeUndefined();
    });

  });
});
