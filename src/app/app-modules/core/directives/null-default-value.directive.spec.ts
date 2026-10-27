import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NullDefaultValueDirective } from './null-default-value.directive';

@Component({
  template: `<input appDefaultNull [formControl]="ctrl" />`,
})
class HostComponent {
  ctrl = new FormControl<string | null>('x');
}

describe('NullDefaultValueDirective', () => {
  let host: HostComponent;
  let input: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [HostComponent, NullDefaultValueDirective],
    });
    const fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.debugElement.query(By.css('input')).nativeElement;
  });

  it('should set control to null when input is cleared', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(host.ctrl.value).toBeNull();
  });

  it('should keep the typed value otherwise', () => {
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));
    expect(host.ctrl.value).toBe('abc');
  });

  it('should do nothing when NgControl has no control', () => {
    const d = new NullDefaultValueDirective({} as any, { control: null } as any);
    expect(() => d.onEvent({ value: '' } as any)).not.toThrow();
  });

  it('should prevent paste, copy and cut', () => {
    ['paste', 'copy', 'cut'].forEach((type) => {
      const e = new Event(type, { cancelable: true });
      input.dispatchEvent(e);
      expect(e.defaultPrevented).toBeTrue();
    });
  });
});
