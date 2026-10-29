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

import { AbdominalExaminationComponent } from './abdominal-examination.component';
import { CameraService } from '../../../../core/services/camera.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('AbdominalExaminationComponent', () => {
  let component: AbdominalExaminationComponent;
  let fixture: ComponentFixture<AbdominalExaminationComponent>;
  let camera: any;

  const LYMPH_NODES = [
    'lymphNode_Inguinal_Left',
    'lymphNode_Inguinal_Right',
    'lymphNode_ExternalIliac_Left',
    'lymphNode_ExternalIliac_Right',
    'lymphNode_ParaAortic_Left',
    'lymphNode_ParaAortic_Right',
  ];

  beforeEach(async () => {
    camera = autoSpy(CameraService);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AbdominalExaminationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: CameraService, useValue: camera },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(AbdominalExaminationComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(AbdominalExaminationComponent);
    component = fixture.componentInstance;
    const controls: Record<string, FormControl> = {
      lymphNodes_Enlarged: new FormControl(true),
      observation: new FormControl(null),
      image: new FormControl(null),
    };
    LYMPH_NODES.forEach((n) => (controls[n] = new FormControl(true)));
    component.abdominalExaminationForm = new FormGroup(controls);
    fixture.detectChanges();
  });

  it('sets the language on init and on ngDoCheck', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('checkWithLymphNodes clears every lymph node field', () => {
    component.checkWithLymphNodes();
    const value = component.abdominalExaminationForm.value;
    LYMPH_NODES.forEach((n) => expect(value[n]).withContext(n).toBeNull());
    expect(value.lymphNodes_Enlarged).toBeTrue();
  });

  it('exposes form controls through getters', () => {
    const form = component.abdominalExaminationForm;
    expect(component.lymphNodes_Enlarged).toBe(form.get('lymphNodes_Enlarged'));
    expect(component.observation).toBe(form.get('observation'));
  });

  describe('annotateImage', () => {
    beforeEach(() => {
      (component as any).abdominalImage = {
        nativeElement: { attributes: { src: { nodeValue: 'abdomen.png' } } },
      };
    });

    it('stores the annotated points with image ID 1', () => {
      camera.annotate.and.returnValue(of({ markers: [2] }));
      component.annotateImage();
      expect(camera.annotate).toHaveBeenCalledWith(
        'abdomen.png',
        null,
        LANGUAGE_EN,
      );
      expect(component.abdominalExaminationForm.value.image).toEqual({
        markers: [2],
        imageID: 1,
      });
      expect(component.abdominalExaminationForm.dirty).toBeTrue();
    });

    it('ignores a cancelled annotation', () => {
      camera.annotate.and.returnValue(of(null));
      component.annotateImage();
      expect(component.abdominalExaminationForm.dirty).toBeFalse();
    });
  });
});
