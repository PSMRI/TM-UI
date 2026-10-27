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

import { OralExaminationComponent } from './oral-examination.component';
import { CameraService } from '../../../../core/services/camera.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('OralExaminationComponent', () => {
  let component: OralExaminationComponent;
  let fixture: ComponentFixture<OralExaminationComponent>;
  let camera: any;

  beforeEach(async () => {
    camera = autoSpy(CameraService);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [OralExaminationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: CameraService, useValue: camera },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(OralExaminationComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(OralExaminationComponent);
    component = fixture.componentInstance;
    component.oralExaminationForm = new FormGroup({
      premalignantLesions: new FormControl(null),
      preMalignantLesionType: new FormControl(null),
      preMalignantLesionTypeList: new FormControl(null),
      otherLesionType: new FormControl('old'),
      observation: new FormControl(null),
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

  describe('preMalignantLesionTypeList changes', () => {
    it('shows the other field when "Any other lesion" is selected', () => {
      component.oralExaminationForm.patchValue({
        preMalignantLesionTypeList: ['Leukoplakia', 'Any other lesion'],
      });
      expect(component.showOther).toBeTrue();
      expect(component.oralExaminationForm.value.otherLesionType).toBe('old');
    });

    it('hides and clears the other field for regular lesions', () => {
      component.showOther = true;
      component.oralExaminationForm.patchValue({
        preMalignantLesionTypeList: ['Leukoplakia'],
      });
      expect(component.showOther).toBeFalse();
      expect(component.oralExaminationForm.value.otherLesionType).toBeNull();
    });

    it('clears the other field when the list is reset to null', () => {
      component.oralExaminationForm.patchValue({
        preMalignantLesionTypeList: null,
      });
      expect(component.oralExaminationForm.value.otherLesionType).toBeNull();
    });
  });

  it('checkWithPremalignantLesion clears the lesion list', () => {
    component.oralExaminationForm.patchValue({
      preMalignantLesionTypeList: ['Leukoplakia'],
    });
    component.checkWithPremalignantLesion();
    expect(
      component.oralExaminationForm.value.preMalignantLesionTypeList,
    ).toBeNull();
  });

  it('exposes form controls through getters', () => {
    const form = component.oralExaminationForm;
    expect(component.premalignantLesions).toBe(form.get('premalignantLesions'));
    expect(component.preMalignantLesionType).toBe(
      form.get('preMalignantLesionType'),
    );
    expect(component.observation).toBe(form.get('observation'));
  });

  describe('annotateImage', () => {
    beforeEach(() => {
      (component as any).oralImage = {
        nativeElement: { attributes: { src: { nodeValue: 'mouth.png' } } },
      };
      component.oralExaminationForm.patchValue({ image: { old: true } });
    });

    it('stores the annotated points with image ID 3', () => {
      camera.annotate.and.returnValue(of({ markers: [1] }));
      component.annotateImage();
      expect(camera.annotate).toHaveBeenCalledWith(
        'mouth.png',
        { old: true },
        LANGUAGE_EN,
      );
      expect(component.oralExaminationForm.value.image).toEqual({
        markers: [1],
        imageID: 3,
      });
      expect(component.oralExaminationForm.dirty).toBeTrue();
    });

    it('keeps the form unchanged when annotation is cancelled', () => {
      camera.annotate.and.returnValue(of(null));
      component.annotateImage();
      expect(component.oralExaminationForm.value.image).toEqual({ old: true });
      expect(component.oralExaminationForm.dirty).toBeFalse();
    });
  });
});
