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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { TelemedicineService } from 'src/app/app-modules/core/services/telemedicine.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SetLanguageComponent } from '../core/components/set-language.component';
import { ServicePointService } from '../service-point/service-point.service';
import { ServiceComponent } from './service.component';

const SERVICE = {
  providerServiceID: 11,
  serviceName: 'HWC',
  serviceID: 9,
  apimanClientKey: 'api-key',
};

function loginResponse(designation: any = 'Nurse', screens = ['Nurse']) {
  return {
    designation: designation ? { designationName: designation } : undefined,
    previlegeObj: [
      {
        serviceName: 'HWC',
        roles: [
          {
            serviceRoleScreenMappings: screens.map((s) => ({
              screen: { screenName: s },
            })),
          },
        ],
      },
    ],
  };
}

const VAN = {
  vanID: 5,
  facilityID: 77,
  vanNoAndType: 'Facility A',
  servicePointID: 88,
  servicePointName: 'SP 1',
  vanSession: 3,
};

const DEMOGRAPHICS = {
  stateMaster: [
    { stateID: 1, stateName: 'Assam' },
    { stateID: 2, stateName: 'Goa' },
  ],
  otherLoc: {
    stateID: 2,
    districtList: [
      {
        districtID: 10,
        districtName: 'North',
        blockId: 20,
        blockName: 'Block',
        districtBranchID: 30,
        villageName: 'V-dist',
        villageList: [{ districtBranchID: 31, villageName: 'Village' }],
      },
    ],
  },
};

describe('ServiceComponent', () => {
  let component: ServiceComponent;
  let fixture: ComponentFixture<ServiceComponent>;
  let sps: any;
  let tele: any;
  let confirm: any;
  let session: any;
  let router: Router;
  let savedApiman: string | null;

  function setup(sessionSeed: Record<string, any>) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ServiceComponent],
      providers: [
        ...commonTestProviders({ session: sessionSeed }),
        { provide: ServicePointService, useValue: sps },
        SetLanguageComponent,
        { provide: TelemedicineService, useValue: tele },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ServiceComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  }

  beforeEach(() => {
    savedApiman = sessionStorage.getItem('apimanClientKey');
    sps = autoSpy(ServicePointService);
    tele = autoSpy(TelemedicineService, {}, undefined);
  });

  afterEach(() => {
    if (savedApiman === null) sessionStorage.removeItem('apimanClientKey');
    else sessionStorage.setItem('apimanClientKey', savedApiman);
  });






  describe('routing', () => {
    beforeEach(() => setup({}));

    const cases: [string, string][] = [
      ['Registrar', '/servicePoint'],
      ['Nurse', '/servicePoint'],
      ['Doctor', '/servicePoint'],
      ['Lab Technician', '/servicePoint'],
      ['TC Specialist', '/nurse-doctor/tcspecialist-worklist'],
    ];
    cases.forEach(([designation, url]) => {
      it(`routes ${designation} to ${url}`, () => {
        component.routeToDesignation(designation);
        expect(router.navigate).toHaveBeenCalledWith([url]);
      });
    });

    it('hands Supervisors over to telemedicine', () => {
      component.routeToDesignation('Supervisor');
      expect(tele.routeToTeleMedecine).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });



});
