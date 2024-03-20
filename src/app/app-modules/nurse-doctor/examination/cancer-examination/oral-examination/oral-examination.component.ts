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
  ElementRef,
  DoCheck,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CameraService } from '../../../../core/services/camera.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-cancer-oral-examination',
  templateUrl: './oral-examination.component.html',
  styleUrls: ['./oral-examination.component.css'],
})
export class OralExaminationComponent implements OnInit, DoCheck {
  @Input()
  oralExaminationForm!: FormGroup;

  @ViewChild('mouthImage')
  private oralImage!: ElementRef;

  showOther = false;
  imagePoints: any;
  current_language_set: any;
  constructor(
    private cameraService: CameraService,
    public httpServiceService: HttpServiceService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.oralExaminationForm
      .get('preMalignantLesionTypeList')
      ?.valueChanges.subscribe((value: [string]) => {
        if (value !== null) {
          if (value.indexOf('Any other lesion') >= 0) {
            this.showOther = true;
          } else {
            this.showOther = false;
            this.oralExaminationForm.patchValue({ otherLesionType: null });
          }
        } else {
          this.oralExaminationForm.patchValue({ otherLesionType: null });
        }
      });
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  checkWithPremalignantLesion() {
    this.oralExaminationForm.patchValue({ preMalignantLesionTypeList: null });
  }

  get premalignantLesions() {
    return this.oralExaminationForm.get('premalignantLesions');
  }

  get preMalignantLesionType() {
    return this.oralExaminationForm.get('preMalignantLesionType');
  }

  get observation() {
    return this.oralExaminationForm.get('observation');
  }

  annotateImage() {
    this.cameraService
      .annotate(
        this.oralImage.nativeElement.attributes.src.nodeValue,
        this.oralExaminationForm.controls['image'].value,
        this.current_language_set,
      )
      .subscribe((result) => {
        if (result) {
          this.imagePoints = result;
          this.imagePoints.imageID = 3;
          this.oralExaminationForm.patchValue({ image: this.imagePoints });
          this.oralExaminationForm.markAsDirty();
        }
      });
  }
}
