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
import { VisitDetailUtils } from './visit-detail-utility';

describe('VisitDetailUtils', () => {
  let utils: VisitDetailUtils;

  beforeEach(() => {
    const session = createSessionStorageMock({
      serviceLineDetails: JSON.stringify({ facilityID: 3, parkingPlaceID: 4 }),
      userName: 'nurse1',
    });
    utils = new VisitDetailUtils(new FormBuilder(), session as any);
  });






  it('maps disease data (note: reads data.disease, not diseaseName)', () => {
    const f = utils.createPatientDiseaseArrayForm({
      disease: 'Diabetes',
      flag: true,
      selected: false,
    });
    expect(f.value).toEqual({
      diseaseName: 'Diabetes',
      flag: true,
      selected: false,
    });
  });

  it('defaults disease data to nulls when none is given', () => {
    const f = utils.createPatientDiseaseArrayForm(null);
    expect(f.get('diseaseName')?.value).toBeNull();
    expect(f.get('flag')?.value).toBeNull();
    expect(f.get('selected')?.value).toBeNull();
  });

  it('creates the covid vaccine status form with null defaults', () => {
    const f = utils.createCovidVaccineStatusForm(false);
    expect(Object.values(f.value).every((v) => v === null)).toBeTrue();
  });
});
