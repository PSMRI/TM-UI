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

import { ImageToCanvasComponent } from './image-to-canvas.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('ImageToCanvasComponent', () => {
  let component: ImageToCanvasComponent;
  let fixture: ComponentFixture<ImageToCanvasComponent>;
  let ctx: any;
  let fakeImg: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ImageToCanvasComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ImageToCanvasComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ImageToCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    ctx = jasmine.createSpyObj('ctx', ['drawImage', 'strokeRect', 'fillText']);
    component.canvas = {
      nativeElement: {
        width: 300,
        height: 200,
        getContext: jasmine.createSpy('getContext').and.returnValue(ctx),
      },
    };
    fakeImg = { width: 100, height: 50 };
    spyOn(window as any, 'Image').and.returnValue(fakeImg);
  });

  it('sets the language on init and on ngDoCheck', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      spyOn(component, 'annotateImage');
      spyOn(component, 'loadImageOnCanvas');
    });

    it('annotates when both markers and an image are present', () => {
      component.imgUrl = 'a.png';
      component.annotatedMarker = { markers: [{ xCord: 1 }] };
      component.ngOnChanges();
      expect(component.annotateImage).toHaveBeenCalledWith(
        [{ xCord: 1 }],
        'a.png',
      );
    });

    it('does nothing when the annotation has no markers', () => {
      component.imgUrl = 'a.png';
      component.annotatedMarker = {};
      component.ngOnChanges();
      expect(component.annotateImage).not.toHaveBeenCalled();
      expect(component.loadImageOnCanvas).not.toHaveBeenCalled();
    });

    it('just loads the image without an annotation', () => {
      component.imgUrl = 'a.png';
      component.ngOnChanges();
      expect(component.loadImageOnCanvas).toHaveBeenCalledWith('a.png');
    });

    it('does nothing without an image', () => {
      component.ngOnChanges();
      expect(component.loadImageOnCanvas).not.toHaveBeenCalled();
    });
  });

  it('loadImageOnCanvas draws the image at 250x250 once loaded', () => {
    component.loadImageOnCanvas('a.png');
    expect(fakeImg.src).toBe('a.png');
    expect(ctx.drawImage).not.toHaveBeenCalled();
    fakeImg.onload();
    expect(ctx.drawImage).toHaveBeenCalledWith(fakeImg, 0, 0, 250, 250);
  });

  it('skips drawing when the canvas has no 2d context', () => {
    component.canvas = { nativeElement: {} };
    component.loadImageOnCanvas('a.png');
    component.annotateImage([], 'a.png');
    expect(window.Image).not.toHaveBeenCalled();
  });

  it('annotateImage scales the image and numbers at most six markers', () => {
    const markers = [
      { xCord: 20, yCord: 30 },
      { offsetX: 40, offsetY: 50 },
      ...Array.from({ length: 5 }, () => ({ offsetX: 1, offsetY: 1 })),
    ];
    component.annotateImage(markers, 'b.png');
    expect(ctx.font).toBe('bold 20px serif');
    fakeImg.onload();

    expect(ctx.drawImage).toHaveBeenCalledWith(
      fakeImg, 0, 0, 100, 50, 0, 0, 300, 200,
    );
    expect(markers[0]).toEqual(
      jasmine.objectContaining({ offsetX: 20, offsetY: 30 }),
    );
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 20, 20);
    expect(ctx.fillText).toHaveBeenCalledWith(1, 17, 36);
    expect(ctx.fillText).toHaveBeenCalledWith(2, 37, 56);
    expect(ctx.strokeRect).toHaveBeenCalledTimes(6);
  });
});
