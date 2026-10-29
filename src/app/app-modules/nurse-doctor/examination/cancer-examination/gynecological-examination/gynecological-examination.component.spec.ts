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
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';

import { GynecologicalExaminationComponent } from './gynecological-examination.component';
import { CameraService } from '../../../../core/services/camera.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('GynecologicalExaminationComponent', () => {
  let component: GynecologicalExaminationComponent;
  let fixture: ComponentFixture<GynecologicalExaminationComponent>;
  let camera: any;

  beforeEach(async () => {
    camera = autoSpy(CameraService);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GynecologicalExaminationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: CameraService, useValue: camera },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(GynecologicalExaminationComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(GynecologicalExaminationComponent);
    component = fixture.componentInstance;
    component.gynecologicalExaminationForm = new FormGroup({
      sufferedFromRTIOrSTI: new FormControl(null),
      rTIOrSTIDetail: new FormControl('detail'),
      observation: new FormControl(null),
      filePath: new FormControl(null),
      image: new FormControl(null),
    });
    fixture.detectChanges();
  });

  it('sets the language on init and on ngDoCheck', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('checkWithRTIOrSTI clears the RTI/STI detail', () => {
    component.checkWithRTIOrSTI();
    expect(
      component.gynecologicalExaminationForm.value.rTIOrSTIDetail,
    ).toBeNull();
  });

  it('exposes form controls through getters', () => {
    const form = component.gynecologicalExaminationForm;
    expect(component.sufferedFromRTIOrSTI).toBe(
      form.get('sufferedFromRTIOrSTI'),
    );
    expect(component.observation).toBe(form.get('observation'));
  });

  it('selectedFiles stores the chosen files as an array', () => {
    const a = new File(['a'], 'a.pdf');
    const b = new File(['b'], 'b.pdf');
    component.selectedFiles({ target: { files: [a, b] } });
    expect(component.gynecologicalExaminationForm.value.filePath).toEqual([
      a,
      b,
    ]);
  });

  describe('annotateImage', () => {
    beforeEach(() => {
      (component as any).gynaecologicalImage = {
        nativeElement: { attributes: { src: { nodeValue: 'gyn.png' } } },
      };
    });

    it('stores the annotated points with image ID 4', () => {
      camera.annotate.and.returnValue(of({ markers: [] }));
      component.annotateImage();
      expect(camera.annotate).toHaveBeenCalledWith('gyn.png', null, LANGUAGE_EN);
      expect(component.gynecologicalExaminationForm.value.image).toEqual({
        markers: [],
        imageID: 4,
      });
      expect(component.gynecologicalExaminationForm.dirty).toBeTrue();
    });

    it('ignores a cancelled annotation', () => {
      camera.annotate.and.returnValue(of(undefined));
      component.annotateImage();
      expect(component.gynecologicalExaminationForm.value.image).toBeNull();
    });
  });
});
