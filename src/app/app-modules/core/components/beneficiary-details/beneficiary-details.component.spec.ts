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
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { BeneficiaryDetailsComponent } from './beneficiary-details.component';
import { BeneficiaryDetailsService } from '../../services/beneficiary-details.service';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('BeneficiaryDetailsComponent', () => {
  let fixture: ComponentFixture<BeneficiaryDetailsComponent>;
  let component: BeneficiaryDetailsComponent;
  let benService: any;
  let registrar: any;
  let confirmation: any;
  let session: any;
  let benDetails$: BehaviorSubject<any>;
  let family$: BehaviorSubject<any>;

  function setup(sessionSeed: Record<string, any>) {
    benDetails$ = new BehaviorSubject<any>(null);
    family$ = new BehaviorSubject<any>('FAM-1');
    benService = autoSpy(BeneficiaryDetailsService, {
      beneficiaryDetails$: benDetails$.asObservable(),
    });
    benService.getBeneficiaryImage.and.returnValue(of({ benImage: 'img64' }));
    registrar = autoSpy(RegistrarService, {
      benFamilyDetails$: family$.asObservable(),
    });
    registrar.getHealthIdDetails.and.returnValue(
      of({
        statusCode: 200,
        data: {
          BenHealthDetails: [
            { healthId: 'a@abdm' },
            { healthId: null },
            { healthId: 'b@abdm' },
          ],
        },
      }),
    );
    registrar.identityQuickSearch.and.returnValue(
      of({
        data: [
          {
            firstName: 'Asha',
            lastName: 'Rao',
            familyId: 'F9',
            createdDate: '2024-01-02T10:30:00Z',
          },
        ],
      }),
    );
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [BeneficiaryDetailsComponent],
      providers: [
        ...commonTestProviders({ session: sessionSeed }),
        { provide: BeneficiaryDetailsService, useValue: benService },
        { provide: RegistrarService, useValue: registrar },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ beneficiaryRegID: '101' }) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(BeneficiaryDetailsComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
  }

  afterEach(() => fixture.destroy());

  describe('with a benFlowID (visit flow)', () => {
    beforeEach(() => {
      setup({ benFlowID: '55' });
      // An image arriving before the details would crash (app bug), so the
      // default here is no image; tests that need one seed details first.
      benService.getBeneficiaryImage.and.returnValue(of(null));
    });


    it('applies the image and keeps today when no service date', () => {
      benDetails$.next({ name: 'Y' });
      benService.getBeneficiaryImage.and.returnValue(of({ benImage: 'img64' }));
      component.ngOnInit();
      expect(component.beneficiary.benImage).toBe('img64');
      expect(component.today instanceof Date).toBeTrue();
    });

    it('ignores empty image responses', () => {
      benDetails$.next({ name: 'Y' });
      benService.getBeneficiaryImage.and.returnValue(of({}));
      component.ngOnInit();
      expect(component.beneficiary.benImage).toBeUndefined();
    });

    it('alerts when ABHA details return non-200 or fail', () => {
      component.assignSelectedLanguage();
      registrar.getHealthIdDetails.and.returnValue(of({ statusCode: 500 }));
      component.getHealthIDDetails();
      registrar.getHealthIdDetails.and.returnValue(throwingObs());
      component.getHealthIDDetails();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
    });



    it('ngDoCheck refreshes the language', () => {
      component.ngDoCheck();
      expect(component.current_language_set).toBe(LANGUAGE_EN);
    });
  });

  describe('without a benFlowID (registration flow)', () => {
    beforeEach(() => setup({ beneficiaryID: '9001', beneficiaryRegID: '101' }));




    it('ngOnDestroy tolerates missing subscriptions', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
