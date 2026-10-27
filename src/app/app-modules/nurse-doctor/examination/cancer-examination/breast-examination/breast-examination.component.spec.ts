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
import { BehaviorSubject, of } from 'rxjs';

import { BreastExaminationComponent } from './breast-examination.component';
import { CameraService } from '../../../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('BreastExaminationComponent', () => {
  let component: BreastExaminationComponent;
  let fixture: ComponentFixture<BreastExaminationComponent>;
  let camera: any;
  let benDetails$: BehaviorSubject<any>;

  beforeEach(async () => {
    camera = autoSpy(CameraService);
    benDetails$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [BreastExaminationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: CameraService, useValue: camera },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(BreastExaminationComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(BreastExaminationComponent);
    component = fixture.componentInstance;
    component.breastExaminationForm = new FormGroup({
      everBreastFed: new FormControl(null),
      breastFeedingDurationGTE6months: new FormControl(true),
      lumpInBreast: new FormControl(null),
      lumpSize: new FormControl('2cm'),
      lumpShape: new FormControl('round'),
      lumpTexture: new FormControl('hard'),
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

  describe('beneficiary gender', () => {
    it('stays false until details arrive or for male beneficiaries', () => {
      expect(component.female).toBeFalse();
      benDetails$.next({ genderName: 'Male' });
      expect(component.female).toBeFalse();
      benDetails$.next({});
      expect(component.female).toBeFalse();
    });

    it('is true for female beneficiaries', () => {
      benDetails$.next({ genderName: 'FEMALE' });
      expect(component.female).toBeTrue();
    });

    it('is true for transgender beneficiaries', () => {
      benDetails$.next({ genderName: 'Transgender' });
      expect(component.female).toBeTrue();
    });
  });

  it('checkBreastFeed clears the feeding duration', () => {
    component.checkBreastFeed();
    expect(
      component.breastExaminationForm.value.breastFeedingDurationGTE6months,
    ).toBeNull();
  });

  it('checkLump clears size, shape and texture', () => {
    component.checkLump();
    const value = component.breastExaminationForm.value;
    expect(value.lumpSize).toBeNull();
    expect(value.lumpShape).toBeNull();
    expect(value.lumpTexture).toBeNull();
  });

  it('exposes form controls through getters', () => {
    const form = component.breastExaminationForm;
    expect(component.everBreastFed).toBe(form.get('everBreastFed'));
    expect(component.lumpInBreast).toBe(form.get('lumpInBreast'));
  });

  it('ngOnDestroy unsubscribes when a subscription is stored', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
    const unsubscribe = jasmine.createSpy('unsubscribe');
    component.beneficiarySubs = { unsubscribe };
    component.ngOnDestroy();
    expect(unsubscribe).toHaveBeenCalled();
  });

  describe('annotateImage', () => {
    beforeEach(() => {
      (component as any).breastsImage = {
        nativeElement: { attributes: { src: { nodeValue: 'breast.png' } } },
      };
    });

    it('stores the annotated points with image ID 2', () => {
      camera.annotate.and.returnValue(of({ markers: [3] }));
      component.annotateImage();
      expect(camera.annotate).toHaveBeenCalledWith(
        'breast.png',
        null,
        LANGUAGE_EN,
      );
      expect(component.breastExaminationForm.value.image).toEqual({
        markers: [3],
        imageID: 2,
      });
      expect(component.breastExaminationForm.dirty).toBeTrue();
    });

    it('ignores a cancelled annotation', () => {
      camera.annotate.and.returnValue(of(null));
      component.annotateImage();
      expect(component.breastExaminationForm.dirty).toBeFalse();
    });
  });
});
