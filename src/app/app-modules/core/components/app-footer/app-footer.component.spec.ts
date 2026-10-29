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
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { of } from 'rxjs';

import { AppFooterComponent } from './app-footer.component';
import { SpecialistLoginComponent } from '../specialist-login/specialist-login.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('AppFooterComponent', () => {
  let component: AppFooterComponent;
  let fixture: ComponentFixture<AppFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AppFooterComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(AppFooterComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    fixture = TestBed.createComponent(AppFooterComponent);
    component = fixture.componentInstance;
  });

  it('sets language and year and polls the online status', fakeAsync(() => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.year).toBe(new Date().getFullYear());
    expect(component.status).toBeFalse();
    tick(1000);
    expect(component.status).toBe(navigator.onLine);
    discardPeriodicTasks();
  }));

  it('refreshes language on ngDoCheck', () => {
    component.currentLanguageSet = undefined;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('openSnackBar opens the specialist login snack bar', () => {
    const afterDismissed = jasmine
      .createSpy('afterDismissed')
      .and.returnValue(of(undefined));
    component.snackBar = {
      openFromComponent: jasmine
        .createSpy('openFromComponent')
        .and.returnValue({ afterDismissed }),
    };
    component.openSnackBar();
    expect(component.snackBar.openFromComponent).toHaveBeenCalledWith(
      SpecialistLoginComponent,
      jasmine.objectContaining({ horizontalPosition: 'right' }),
    );
    expect(afterDismissed).toHaveBeenCalled();
  });
});
