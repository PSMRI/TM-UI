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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import { TmLogoutComponent } from './tm-logout.component';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('TmLogoutComponent', () => {
  let component: TmLogoutComponent;
  let fixture: ComponentFixture<TmLogoutComponent>;
  let router: Router;
  let storage: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TmLogoutComponent],
      providers: [...commonTestProviders({ session: { userID: 1 } })],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(TmLogoutComponent, '')
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    storage = TestBed.inject(SessionStorageService);
    spyOn(sessionStorage, 'clear');
    fixture = TestBed.createComponent(TmLogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clears both browser and app session storage on init', () => {
    expect(sessionStorage.clear).toHaveBeenCalled();
    expect(storage.clear).toHaveBeenCalled();
    expect(storage.store.size).toBe(0);
  });

  it('redirects to login on init', () => {
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
