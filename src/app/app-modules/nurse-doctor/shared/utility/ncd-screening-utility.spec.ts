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
import { FormBuilder } from '@angular/forms';

import { NCDScreeningUtils } from './ncd-screening-utility';
import { createSessionStorageMock } from 'src/testing/test-utils';

describe('NCDScreeningUtils', () => {
  let utils: NCDScreeningUtils;

  beforeEach(() => {
    const session = createSessionStorageMock({
      serviceLineDetails: JSON.stringify({ vanID: 7, parkingPlaceID: 8 }),
    });
    utils = new NCDScreeningUtils(TestBed.inject(FormBuilder), session as any);
  });

  it('createNCDScreeningForm builds an empty screening form for the van', () => {
    const form = utils.createNCDScreeningForm();
    expect(form.value).toEqual(
      jasmine.objectContaining({
        ncdScreeningConditionList: null,
        labTestOrders: null,
        height_cm: null,
        averageSystolicBP_Reading: null,
        bloodGlucose_NotSpecified: null,
        isScreeningComplete: null,
        vanID: 7,
        parkingPlaceID: 8,
      }),
    );
    expect(Object.keys(form.controls).length).toBe(30);
  });

  it('createIDRSForm builds an IDRS form for the van', () => {
    const form = utils.createIDRSForm();
    expect(form.value).toEqual({
      beneficiaryRegID: null,
      providerServiceMapID: null,
      createdBy: null,
      idrsScore: null,
      questionArray: null,
      suspectArray: null,
      confirmArray: null,
      deleted: false,
      requiredList: null,
      isDiabetic: null,
      vanID: 7,
      parkingPlaceID: 8,
    });
  });
});
