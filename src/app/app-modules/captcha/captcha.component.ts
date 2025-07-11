import {
  Component,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
  Inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CaptchaService } from '../core/services/captcha.service';
import { environment } from 'src/environments/environment';

declare const turnstile: any;

@Component({
  selector: 'app-captcha',
  templateUrl: './captcha.component.html',
})
export class CaptchaComponent implements AfterViewInit, OnDestroy {
  @Output() tokenResolved = new EventEmitter<string>();
  @ViewChild('captchaContainer') captchaRef!: ElementRef;
  private widgetId: string | null = null;

  constructor(
    private el: ElementRef,
    private captchaService: CaptchaService,
  ) {}

  async ngAfterViewInit() {
    try {
      await this.captchaService.loadScript();

      const captchaElement = this.captchaRef?.nativeElement;
      if (!captchaElement) {
        console.error('CAPTCHA container element not found');
        return;
      }

      if (!this.widgetId) {
        this.widgetId = turnstile.render(captchaElement, {
          sitekey: environment.siteKey,
          theme: 'light',
          callback: (token: string) => this.tokenResolved.emit(token),
        });
      }
    } catch (error) {
      console.error('Failed to initialize CAPTCHA:', error);
    }
  }

  public reset() {
    if (this.widgetId && typeof turnstile !== 'undefined') {
      turnstile.reset(this.widgetId);
    }
  }

  ngOnDestroy() {
    if (this.widgetId && typeof turnstile !== 'undefined' && turnstile.remove) {
      turnstile.remove(this.widgetId);
    }
  }
}
