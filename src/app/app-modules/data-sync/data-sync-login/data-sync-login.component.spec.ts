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
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DataSyncService } from '../shared/service/data-sync.service';
import { DataSyncLoginComponent } from './data-sync-login.component';

describe('DataSyncLoginComponent', () => {
  let component: DataSyncLoginComponent;
  let fixture: ComponentFixture<DataSyncLoginComponent>;
  let dataSync: any;
  let confirm: any;
  let session: any;
  let router: Router;

  const loginRes = (services: any[]) =>
    of({
      statusCode: 200,
      data: { key: 'KEY', previlegeObj: services },
    });

  async function setup(dialogData: any) {
    dataSync = autoSpy(DataSyncService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DataSyncLoginComponent],
      providers: [...commonTestProviders({ dialogData })],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DataSyncLoginComponent, {
        set: { providers: [{ provide: DataSyncService, useValue: dataSync }] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(DataSyncLoginComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  afterEach(() => sessionStorage.removeItem('authorizeToViewTMcasesheet'));

  describe('without dialog flags', () => {
    beforeEach(async () => setup({}));


    it('ngDoCheck re-assigns language', () => {
      component.current_language_set = undefined;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('showPWD / hidePWD toggle input type', () => {
      component.showPWD();
      expect(component.dynamictype).toBe('text');
      component.hidePWD();
      expect(component.dynamictype).toBe('password');
    });









  });



  it('works without dialog providers (injector returns null)', async () => {
    dataSync = autoSpy(DataSyncService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DataSyncLoginComponent],
      providers: commonTestProviders().filter(
        (p: any) => p.provide !== MatDialogRef && p.provide !== MAT_DIALOG_DATA,
      ),
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DataSyncLoginComponent, {
        set: { providers: [{ provide: DataSyncService, useValue: dataSync }] },
      })
      .compileComponents();
    const f = TestBed.createComponent(DataSyncLoginComponent);
    f.detectChanges();
    expect(f.componentInstance.dialogRef).toBeNull();
    expect(f.componentInstance.data).toBeNull();
  });
});
