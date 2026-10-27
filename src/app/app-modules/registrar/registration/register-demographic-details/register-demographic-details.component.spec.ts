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
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { RegisterDemographicDetailsComponent } from './register-demographic-details.component';
import { RegistrarService } from '../../shared/services/registrar.service';
import { RegistrationUtils } from '../../shared/utility/registration-utility';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { MaterialModule } from '../../../core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

const DISTRICT = {
  districtID: 10,
  districtName: 'Bengaluru',
  blockId: 100,
  blockName: 'North',
  villageList: [{ districtBranchID: 1000, villageName: 'Hebbal' }],
};

function location(overrides: any = {}) {
  return {
    stateMaster: [
      { stateID: 1, stateName: 'Karnataka' },
      { stateID: 2, stateName: 'Kerala' },
    ],
    otherLoc: {
      stateID: 1,
      stateName: 'Karnataka',
      districtList: [DISTRICT],
      zoneID: 3,
      zoneName: 'Z',
      parkingPlaceID: 4,
      parkingPlaceName: 'PP',
    },
    ...overrides,
  };
}

const EDIT_DATA = {
  beneficiaryID: 77,
  i_bendemographics: {
    habitation: 'H',
    addressLine1: 'A1',
    addressLine2: 'A2',
    addressLine3: 'A3',
    pinCode: '560001',
    m_state: { stateID: 2, stateName: 'Kerala', stateCode: 'KL' },
    m_district: { districtID: 20, districtName: 'Kochi' },
    m_districtblock: { blockID: 200, blockName: 'Blk' },
    m_districtbranchmapping: { districtBranchID: 2000, villageName: 'Vil' },
    zoneID: 5,
    zoneName: 'ZN',
    parkingPlaceID: 6,
    parkingPlaceName: 'PPN',
    servicePointID: 7,
    servicePointName: 'SPN',
  },
};

describe('RegisterDemographicDetailsComponent', () => {
  let fixture: ComponentFixture<RegisterDemographicDetailsComponent>;
  let component: RegisterDemographicDetailsComponent;
  let registrar: any;
  let confirmation: any;
  let router: Router;
  let form: FormGroup;

  async function setup(
    opts: { revisit?: boolean; loc?: any; edit?: any } = {},
  ) {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>({ m: 1 }),
      beneficiaryEditDetails$: new BehaviorSubject<any>(opts.edit ?? null),
      districtList$: new BehaviorSubject<any>([{ districtID: 1 }]),
      subDistrictList$: new BehaviorSubject<any>([{ blockID: 1 }]),
      dialogResult$: new BehaviorSubject<any>(null),
      stateIdFamily: 'unset',
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [RegisterDemographicDetailsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            location: JSON.stringify(opts.loc ?? location()),
            servicePointID: 8,
            servicePointName: 'SP',
          },
        }),
        { provide: RegistrarService, useValue: registrar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterDemographicDetailsComponent);
    component = fixture.componentInstance;
    form = new RegistrationUtils(
      new FormBuilder(),
    ).createDemographicDetailsForm();
    component.demographicDetailsForm = form;
    component.patientRevisit = !!opts.revisit;
    confirmation = TestBed.inject(ConfirmationService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }




  describe('new beneficiary without location masters', () => {
    beforeEach(async () => setup({ loc: {} }));

    it('leaves the form untouched', () => {
      expect(component.statesList).toBeUndefined();
      expect(form.value.servicePoint).toBeNull();
      expect(component.demographicsMaster.servicePointID).toBe(8);
    });
  });

  describe('edit beneficiary', () => {
    beforeEach(async () => setup({ revisit: true, edit: EDIT_DATA }));


    it('falls back to nulls for missing edit details', () => {
      component.revisitData = { i_bendemographics: { m_state: {} } };
      component.loadEditDefaults();
      component.loadBenEditDetails();
      expect(form.value).toEqual(
        jasmine.objectContaining({
          stateID: null,
          districtID: null,
          blockID: null,
          villageID: null,
          zoneID: null,
          parkingPlace: null,
          servicePoint: null,
          habitation: null,
          pincode: null,
        }),
      );
      component.revisitData = {};
      component.loadBenEditDetails();
      expect(form.value.addressLine1).toBeNull();
    });

    it('ignores edit data without a beneficiaryID', () => {
      registrar.beneficiaryEditDetails$.next({ foo: 1 });
      expect(component.revisitData).toEqual(EDIT_DATA);
    });

    it('ngOnDestroy unsubscribes the revisit subscription', () => {
      const sub = component.revisitDataSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });
  });

  describe('edit beneficiary with empty location storage', () => {
    beforeEach(async () => setup({ revisit: true, edit: EDIT_DATA, loc: {} }));

    it('does not set states list', () => {
      expect(component.statesList).toBeUndefined();
      expect(form.value.stateID).toBe(2);
    });
  });
});
