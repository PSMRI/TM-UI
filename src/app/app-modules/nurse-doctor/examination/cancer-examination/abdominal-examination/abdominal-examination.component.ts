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
  ViewChild,
  ElementRef,
  Input,
  DoCheck,
} from '@angular/core';
import { CameraService } from '../../../../core/services/camera.service';
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
    selector: 'app-doctor-abdominal-examination',
    templateUrl: './abdominal-examination.component.html',
    styleUrls: ['./abdominal-examination.component.css'],
    standalone: false
})
export class AbdominalExaminationComponent implements OnInit, DoCheck {
  @Input()
  abdominalExaminationForm!: FormGroup;

  @ViewChild('abdominalImage')
  private abdominalImage!: ElementRef;

  imagePoints: any;
  current_language_set: any;

  constructor(
    private cameraService: CameraService,
    public httpServiceService: HttpServiceService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  checkWithLymphNodes() {
    this.abdominalExaminationForm.patchValue({ lymphNode_Inguinal_Left: null });
    this.abdominalExaminationForm.patchValue({
      lymphNode_Inguinal_Right: null,
    });
    this.abdominalExaminationForm.patchValue({
      lymphNode_ExternalIliac_Left: null,
    });
    this.abdominalExaminationForm.patchValue({
      lymphNode_ExternalIliac_Right: null,
    });
    this.abdominalExaminationForm.patchValue({
      lymphNode_ParaAortic_Left: null,
    });
    this.abdominalExaminationForm.patchValue({
      lymphNode_ParaAortic_Right: null,
    });
  }

  get lymphNodes_Enlarged() {
    return this.abdominalExaminationForm.get('lymphNodes_Enlarged');
  }

  get observation() {
    return this.abdominalExaminationForm.get('observation');
  }

  annotateImage() {
    this.cameraService
      .annotate(
        this.abdominalImage.nativeElement.attributes.src.nodeValue,
        this.abdominalExaminationForm.controls['image'].value,
        this.current_language_set,
      )
      .subscribe((result) => {
        if (result) {
          this.imagePoints = result;
          this.imagePoints.imageID = 1;
          this.abdominalExaminationForm.patchValue({ image: this.imagePoints });
          this.abdominalExaminationForm.markAsDirty();
        }
      });
  }
}
