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

import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { SpinnerService, SpinnerState } from '../../services';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-spinner',
    templateUrl: './spinner.component.html',
    styleUrls: ['./spinner.component.css'],
    standalone: false
})
export class SpinnerComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  role!: string;

  visible = false;

  private spinnerStateChanged!: Subscription;

  constructor(public spinnerService: SpinnerService) {}

  ngOnInit() {
    this.spinnerStateChanged = this.spinnerService.spinnerState.subscribe(
      (state: SpinnerState) => {
        if (this.visible !== state.show) {
          console.log('spinner called once');
          this.visible = state.show;
        }
      },
    );
  }

  ngOnChanges() {
    console.log('I am groot', this.role);
  }

  ngOnDestroy() {
    this.spinnerStateChanged.unsubscribe();
  }
}
