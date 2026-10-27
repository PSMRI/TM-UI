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

import { SpinnerComponent } from './spinner.component';
import { SpinnerService } from '../../services/spinner.service';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;
  let spinner: SpinnerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpinnerComponent],
      providers: [SpinnerService],
    })
      .overrideTemplate(SpinnerComponent, '')
      .compileComponents();

    spyOn(console, 'log');
    spinner = TestBed.inject(SpinnerService);
    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('follows the spinner state', () => {
    expect(component.visible).toBeFalse();
    spinner.show();
    expect(component.visible).toBeTrue();
    spinner.hide();
    expect(component.visible).toBeFalse();
  });

  it('logs the role on changes', () => {
    component.role = 'nurse';
    component.ngOnChanges();
    expect(console.log).toHaveBeenCalledWith('I am groot', 'nurse');
  });

  it('stops listening on destroy', () => {
    fixture.destroy();
    spinner.show();
    expect(component.visible).toBeFalse();
  });
});
