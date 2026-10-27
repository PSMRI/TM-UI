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
  tick,
} from '@angular/core/testing';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import { CancerExaminationComponent } from './cancer-examination.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { CancerUtils } from '../../shared/utility/cancer-utility';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('CancerExaminationComponent', () => {
  let component: CancerExaminationComponent;
  let fixture: ComponentFixture<CancerExaminationComponent>;
  let doctorService: any;
  let confirmation: any;
  let storage: any;
  let benDetails$: BehaviorSubject<any>;

  const SESSION = {
    serviceLineDetails: JSON.stringify({ vanID: 8, parkingPlaceID: 9 }),
    beneficiaryRegID: 22,
    visitID: 11,
    providerServiceID: 3,
    userName: 'doc',
    beneficiaryID: 44,
    sessionID: 5,
    benFlowID: 66,
    visitCode: 77,
  };

  beforeEach(async () => {
    doctorService = autoSpy(DoctorService);
    benDetails$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerExaminationComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: DoctorService, useValue: doctorService },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerExaminationComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    confirmation = TestBed.inject(ConfirmationService);
    storage = TestBed.inject(SessionStorageService);
    fixture = TestBed.createComponent(CancerExaminationComponent);
    component = fixture.componentInstance;
    component.cancerForm = new CancerUtils(
      TestBed.inject(FormBuilder),
      storage,
    ).createCancerExaminationForm();
  });

  const sub = (name: string) => component.cancerForm.get(name) as FormGroup;

  describe('ngOnInit', () => {
    beforeEach(() => fixture.detectChanges());

    it('sets the language and extracts every sub-form', () => {
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.signsForm).toBe(sub('signsForm'));
      expect(component.oralExaminationForm).toBe(sub('oralExaminationForm'));
      expect(component.breastExaminationForm).toBe(
        sub('breastExaminationForm'),
      );
      expect(component.abdominalExaminationForm).toBe(
        sub('abdominalExaminationForm'),
      );
      expect(component.gynecologicalExaminationForm).toBe(
        sub('gynecologicalExaminationForm'),
      );
    });

    it('toggles breast examination with breast enlargement', () => {
      sub('signsForm').patchValue({ breastEnlargement: true });
      expect(component.showBreastExamination).toBeTrue();
      sub('signsForm').patchValue({ breastEnlargement: false });
      expect(component.showBreastExamination).toBeFalse();
    });

    it('flags female and transgender beneficiaries', () => {
      benDetails$.next({ genderName: 'Male' });
      expect(component.female).toBeFalse();
      benDetails$.next({ genderName: 'Transgender' });
      expect(component.female).toBeTrue();
    });

    it('refreshes language on ngDoCheck', () => {
      component.current_language_set = undefined;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      spyOn(component, 'upadteCancerExaminationDetails');
      spyOn(component, 'fetchCancerExaminationDetails');
    });

    it('updates in update mode', () => {
      component.mode = 'update';
      component.ngOnChanges();
      expect(component.upadteCancerExaminationDetails).toHaveBeenCalled();
      expect(component.fetchCancerExaminationDetails).not.toHaveBeenCalled();
    });

    it('fetches in view mode', () => {
      component.mode = 'view';
      component.ngOnChanges();
      expect(component.fetchCancerExaminationDetails).toHaveBeenCalledTimes(1);
    });

    it('fetches for specialist flag 100', () => {
      storage.setItem('specialistFlag', '100');
      component.ngOnChanges();
      expect(component.fetchCancerExaminationDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('getImageCoordinates', () => {
    it('collects images only from dirty sub-forms', () => {
      sub('oralExaminationForm').patchValue({ image: { imageID: 3 } });
      sub('oralExaminationForm').markAsDirty();
      sub('breastExaminationForm').patchValue({ image: { imageID: 2 } });
      sub('abdominalExaminationForm').markAsDirty();
      sub('gynecologicalExaminationForm').patchValue({
        image: { imageID: 4 },
      });
      sub('gynecologicalExaminationForm').markAsDirty();

      expect(component.getImageCoordinates(component.cancerForm)).toEqual([
        { imageID: 3 },
        { imageID: 4 },
      ]);
    });
  });

  describe('upadteCancerExaminationDetails', () => {
    beforeEach(() => fixture.detectChanges());

    it('sends session details and alerts success asynchronously', fakeAsync(() => {
      doctorService.updateCancerExaminationDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } }),
      );
      component.cancerForm.markAsDirty();
      component.upadteCancerExaminationDetails();

      expect(doctorService.updateCancerExaminationDetails).toHaveBeenCalledWith(
        component.cancerForm,
        {
          beneficiaryRegID: 22,
          benVisitID: 11,
          providerServiceMapID: 3,
          modifiedBy: 'doc',
          beneficiaryID: 44,
          sessionID: 5,
          parkingPlaceID: 9,
          vanID: 8,
          benFlowID: 66,
          visitCode: 77,
        },
        [],
      );
      expect(component.cancerForm.pristine).toBeTrue();
      expect(confirmation.alert).not.toHaveBeenCalled();
      tick();
      expect(confirmation.alert).toHaveBeenCalledWith('saved', 'success');
    }));

    it('alerts the error message on failure', fakeAsync(() => {
      doctorService.updateCancerExaminationDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.upadteCancerExaminationDetails();
      tick();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
    }));

    it('alerts on http error', fakeAsync(() => {
      doctorService.updateCancerExaminationDetails.and.returnValue(
        throwingObs('down'),
      );
      component.upadteCancerExaminationDetails();
      tick();
      expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
    }));
  });

  describe('fetchCancerExaminationDetails', () => {
    beforeEach(() => fixture.detectChanges());

    it('patches the details on success', () => {
      spyOn(component, 'patchExaminationDetails');
      doctorService.getCancerExaminationDetails.and.returnValue(
        of({ statusCode: 200, data: { x: 1 } }),
      );
      component.fetchCancerExaminationDetails();
      expect(doctorService.getCancerExaminationDetails).toHaveBeenCalledWith(
        22,
        11,
      );
      expect(component.patchExaminationDetails).toHaveBeenCalledWith({ x: 1 });
    });

    it('alerts on failure and on http error', fakeAsync(() => {
      doctorService.getCancerExaminationDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'none' }),
      );
      component.fetchCancerExaminationDetails();
      doctorService.getCancerExaminationDetails.and.returnValue(
        throwingObs('down'),
      );
      component.fetchCancerExaminationDetails();
      tick();
      expect(confirmation.alert).toHaveBeenCalledWith('none', 'error');
      expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
    }));
  });

  describe('filterAnnotatedImageList', () => {
    it('returns the single image with the given ID', () => {
      const list = [{ imageID: 1 }, { imageID: 2 }];
      expect(component.filterAnnotatedImageList(list, 2)).toEqual({
        imageID: 2,
      });
    });

    it('returns undefined when there is no unique match', () => {
      const list = [{ imageID: 1 }, { imageID: 1 }];
      expect(component.filterAnnotatedImageList(list, 1)).toBeUndefined();
      expect(component.filterAnnotatedImageList(list, 5)).toBeUndefined();
    });
  });

  describe('patchExaminationDetails', () => {
    beforeEach(() => fixture.detectChanges());

    const images = [
      { imageID: 1, a: 1 },
      { imageID: 2, b: 2 },
      { imageID: 3, c: 3 },
      { imageID: 4, d: 4 },
    ];

    it('patches signs and symptoms', () => {
      component.patchExaminationDetails({
        signsAndSymptoms: { shortnessOfBreath: true },
        BenCancerLymphNodeDetails: [],
      });
      expect(sub('signsForm').value.shortnessOfBreath).toBeTrue();
    });

    it('throws for lymph node rows, which are FormControls (current behaviour)', () => {
      expect(() =>
        component.patchExaminationDetails({
          signsAndSymptoms: {},
          BenCancerLymphNodeDetails: [{ lymphNodeName: ' Sub Mental' }],
        }),
      ).toThrowError(TypeError);
    });

    it('splits known oral lesions and keeps an unknown one as "other"', () => {
      component.patchExaminationDetails({
        imageCoordinates: images,
        oralExamination: {
          preMalignantLesionType: 'Leukoplakia,Betel stain,',
          observation: 'oral',
        },
      });
      const oral = sub('oralExaminationForm').value;
      expect(oral.preMalignantLesionTypeList).toEqual([
        'Leukoplakia',
        'Betel stain',
        'Any other lesion',
      ]);
      expect(oral.otherLesionType).toBe('Betel stain');
      expect(oral.observation).toBe('oral');
      expect(oral.image).toEqual({ imageID: 3, c: 3 });
    });

    it('patches oral lesions without an other type', () => {
      component.patchExaminationDetails({
        imageCoordinates: [],
        oralExamination: { preMalignantLesionType: 'Melanoplakia,' },
      });
      const oral = sub('oralExaminationForm').value;
      expect(oral.preMalignantLesionTypeList).toEqual(['Melanoplakia']);
      expect(oral.otherLesionType).toBeNull();
      expect(oral.image).toBeUndefined();
    });

    it('patches breast, abdominal and gynecological examinations with their images', () => {
      component.patchExaminationDetails({
        imageCoordinates: images,
        breastExamination: { lumpInBreast: true },
        abdominalExamination: { lymphNodes_Enlarged: false },
        gynecologicalExamination: {
          typeOfLesion: 'Ulcer,Growth,',
          observation: 'gyn',
        },
      });
      expect(sub('breastExaminationForm').value.lumpInBreast).toBeTrue();
      expect(sub('breastExaminationForm').value.image).toEqual(images[1]);
      expect(sub('abdominalExaminationForm').value.image).toEqual(images[0]);
      const gyn = sub('gynecologicalExaminationForm').value;
      expect(gyn.typeOfLesionList).toEqual(['Ulcer', 'Growth']);
      expect(gyn.observation).toBe('gyn');
      expect(gyn.image).toEqual(images[3]);
    });
  });

  it('ngOnDestroy unsubscribes every subscription', () => {
    fixture.detectChanges();
    component.fetchCancerExaminationDetails();
    component.upadteCancerExaminationDetails();
    const subs = [
      component.beneficiaryDetailsSubscription,
      component.fetchExaminationDetailsSubs,
      component.updateExaminationSubs,
    ];
    subs.forEach((s) => spyOn(s, 'unsubscribe').and.callThrough());
    component.ngOnDestroy();
    subs.forEach((s) => expect(s.unsubscribe).toHaveBeenCalled());
  });
});
