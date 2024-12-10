/*
 * AMRIT � Accessible Medical Records via Integrated Technology
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
  Component,
  OnInit,
  Input,
  ViewChild,
  OnDestroy,
  DoCheck,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { CancerUtils } from '../../../shared/utility';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-doctor-signs-and-symptoms',
  templateUrl: './signs-and-symptoms.component.html',
  styleUrls: ['./signs-and-symptoms.component.css'],
})
export class SignsAndSymptomsComponent implements OnInit, OnDestroy, DoCheck {
  @Input()
  signsForm!: FormGroup;
  displayedColumns: any = [
    'left',
    'mobility_left',
    'lymphnodes',
    'mobility_right',
    'right',
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  female18 = false;
  female30 = false;
  female = false;
  current_language_set: any;
  constructor(
    private fb: FormBuilder,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getBeneficiaryDetails();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubs) this.beneficiaryDetailsSubs.unsubscribe();
  }

  getLymphNodes(): AbstractControl[] | null {
    console.log('getLymnNodes', this.signsForm);
    const lymphNodesControl = this.signsForm.get('lymphNodes');
    return lymphNodesControl instanceof FormArray
      ? lymphNodesControl.controls
      : null;
  }

  beneficiaryDetailsSubs: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubs =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiaryDetails) => {
          if (
            beneficiaryDetails &&
            beneficiaryDetails.genderName &&
            (beneficiaryDetails.genderName.toLocaleLowerCase() === 'female' ||
              beneficiaryDetails.genderName.toLocaleLowerCase() ===
                'transgender')
          )
            this.female = true;
          else this.female = false;

          if (
            beneficiaryDetails &&
            beneficiaryDetails.genderName &&
            beneficiaryDetails.genderName.toLocaleLowerCase() === 'female' &&
            beneficiaryDetails.ageVal >= 18
          )
            this.female18 = true;
          else this.female18 = false;

          if (
            beneficiaryDetails &&
            beneficiaryDetails.genderName &&
            beneficiaryDetails.genderName.toLocaleLowerCase() === 'female' &&
            beneficiaryDetails.ageVal >= 30
          )
            this.female30 = true;
          else this.female30 = false;
        },
      );
  }

  checkLymph(lymphNode_Enlarged: any) {
    if (!lymphNode_Enlarged) {
      this.signsForm.patchValue({
        lymphNodes: new CancerUtils(
          this.fb,
          this.sessionstorage,
        ).lymphNodesArray.map((item) => item),
      });
    }
    const lymphNodesControl = this.signsForm.get('lymphNodes');
    let LymphNodesdata: any = [];
    LymphNodesdata =
      lymphNodesControl instanceof FormArray
        ? lymphNodesControl.controls
        : null;
    this.dataSource.data = LymphNodesdata;
  }

  get observation() {
    return this.signsForm.get('observation');
  }

  get lymphNode_Enlarged() {
    return this.signsForm.controls['lymphNode_Enlarged'].value;
  }

  get lymphNodes() {
    return this.signsForm.controls['lymphNodes'].value;
  }
}
