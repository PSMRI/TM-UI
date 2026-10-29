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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { createSessionStorageMock } from 'src/testing/test-utils';
import { QuickConsultUtils } from './quick-consult-utility';

describe('QuickConsultUtils', () => {
  let utils: QuickConsultUtils;

  beforeEach(() => {
    const session = createSessionStorageMock({
      serviceLineDetails: JSON.stringify({ facilityID: 9, parkingPlaceID: 8 }),
    });
    utils = new QuickConsultUtils(new FormBuilder(), session as any);
  });





  it('initMedicineWithData uses plain strength when unit missing', () => {
    const f = utils.initMedicineWithData({
      drugStrength: '250',
      duration: 1,
      unit: 'Week',
    });
    expect(f.get('drugStrength')?.value).toBe('250');
    expect(f.get('createdBy')?.value).toBeNull();
  });
});
