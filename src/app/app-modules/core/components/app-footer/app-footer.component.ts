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

import { Component, OnInit, DoCheck } from '@angular/core';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { SpecialistLoginComponent } from '../specialist-login/specialist-login.component';

@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.css'],
})
export class AppFooterComponent implements OnInit, DoCheck {
  currentLanguageSet: any;
  status = false;
  isSpecialist = false;
  snackBar: any;

  constructor(public httpServiceService: HttpServiceService) {}
  year: any;
  today!: Date;

  ngOnInit() {
    this.assignSelectedLanguage();
    this.today = new Date();
    this.year = this.today.getFullYear();
    console.log('inside footer', this.year);
    setInterval(() => {
      this.status = navigator.onLine;
    }, 1000);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  openSnackBar() {
    const snackBarRef: MatSnackBarRef<SpecialistLoginComponent> =
      this.snackBar.openFromComponent(SpecialistLoginComponent, {
        horizontalPosition: 'right',
        data: {
          message: 'string',
          action: 'Save',
        },
      });
    snackBarRef.afterDismissed().subscribe(() => {
      // value to be stored here -
      //  console.log('locsl', JSON.parse(this.sessionstorage.getItem('swymedLogin')));
    });
  }
}
