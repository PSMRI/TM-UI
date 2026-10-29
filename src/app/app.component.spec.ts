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
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  Event,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  ResolveStart,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';
import { Subject } from 'rxjs';

import { AppComponent } from './app.component';
import { SpinnerService } from './app-modules/core/services/spinner.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let events$: Subject<Event>;
  let spinner: jasmine.SpyObj<SpinnerService>;

  beforeEach(async () => {
    events$ = new Subject<Event>();
    spinner = jasmine.createSpyObj('SpinnerService', ['show', 'hide']);

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        { provide: Router, useValue: { events: events$.asObservable() } },
        { provide: SpinnerService, useValue: spinner },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(AppComponent, '')
      .compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the spinner while resolving or lazy loading routes', () => {
    events$.next(new ResolveStart(1, '/a', '/a', {} as any));
    events$.next(new RouteConfigLoadStart({}));
    expect(spinner.show).toHaveBeenCalledTimes(2);
  });

  [
    ['NavigationEnd', () => new NavigationEnd(1, '/a', '/a')],
    ['RouteConfigLoadEnd', () => new RouteConfigLoadEnd({})],
    ['NavigationError', () => new NavigationError(1, '/a', 'x')],
    ['NavigationCancel', () => new NavigationCancel(1, '/a', 'x')],
  ].forEach(([name, make]: any) => {
    it(`hides the spinner 500ms after ${name}`, fakeAsync(() => {
      events$.next(make());
      tick(499);
      expect(spinner.hide).not.toHaveBeenCalled();
      tick(1);
      expect(spinner.hide).toHaveBeenCalledTimes(1);
    }));
  });

  it('ignores other router events', fakeAsync(() => {
    events$.next(new NavigationStart(1, '/a'));
    tick(1000);
    expect(spinner.show).not.toHaveBeenCalled();
    expect(spinner.hide).not.toHaveBeenCalled();
  }));
});
