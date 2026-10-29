import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StringValidatorDirective } from './stringValidator.directive';

@Component({
  template: `<input [allowText]="pattern" maxlength="5" />`,
})
class HostComponent {
  pattern = 'number';
}

describe('StringValidatorDirective', () => {
  let directive: StringValidatorDirective;

  const event = (value: string, maxLength = -1, length?: number) => ({
    target: { value, maxLength, length },
  });

  beforeEach(() => {
    directive = new StringValidatorDirective({} as any);
  });

  describe('validate', () => {
    const cases: [string, string, boolean][] = [
      ['alphabet', 'abc', true],
      ['alphabet', 'ab1', false],
      ['alphaspace', 'ab c', true],
      ['alphanumeric', 'ab12', true],
      ['alphanumeric', 'ab 12', false],
      ['alphanumericspace', 'ab 12', true],
      ['number', '123', true],
      ['number', '12a', false],
      ['numberslash', '12/3', true],
      ['alphanumerichyphen', 'a-1/b', true],
      ['numerichyphen', '12-3', true],
      ['decimal', '12.34', true],
      ['decimal', '12.345', false],
      ['address', '#12, Main St.', true],
      ['inputFieldValidator', 'ab 1', true],
      ['textAreaValidator', 'a, b.', true],
      ['questionnaireValidator', 'why?', true],
      ['addressValidator', '1/2-#', true],
      ['smsTemplateValidator', 'Hi $1: (x)', true],
      ['itemNameSearchValidator', 'Para 5%', true],
      ['itemNameMasterValidator', 'Para-5%(x)', true],
      ['answerValidator', 'a/b-c', true],
      ['usernameValidator', 'user_1', false],
    ];
    cases.forEach(([pattern, input, expected]) => {
      it(`${pattern} -> "${input}" should be ${expected}`, () => {
        directive.allowText = pattern;
        expect(directive.validate(input)).toBe(expected);
      });
    });

    it('should trim the pattern code', () => {
      directive.allowText = '  number ';
      expect(directive.validate('12')).toBeTrue();
    });

    it('should return false for empty or null input', () => {
      directive.allowText = 'alphabet';
      expect(directive.validate('')).toBeFalse();
      expect(directive.validate(null)).toBeFalse();
    });

    it('should return false for an unknown pattern', () => {
      directive.allowText = 'unknown';
      expect(directive.validate('abc')).toBeFalse();
    });
  });

  describe('onInput', () => {
    it('should keep a valid typed character', () => {
      directive.allowText = 'alphabet';
      directive.lastValue = 'ab' as any;
      const e = event('abc');
      directive.onInput(e);
      expect(e.target.value).toBe('abc');
      expect(directive.lastValue).toBe('abc' as any);
    });

    it('should revert an invalid typed character', () => {
      directive.allowText = 'alphabet';
      directive.lastValue = 'ab' as any;
      const e = event('ab1');
      directive.onInput(e);
      expect(e.target.value).toBe('ab');
    });

    it('should allow deleting characters', () => {
      directive.allowText = 'alphabet';
      directive.lastValue = 'abc' as any;
      const e = event('ab');
      directive.onInput(e);
      expect(e.target.value).toBe('ab');
    });

    it('should revert when maxLength is exceeded', () => {
      directive.allowText = 'alphabet';
      directive.lastValue = 'abc' as any;
      const e = event('abcd', 3);
      directive.onInput(e);
      expect(e.target.value).toBe('abc');
    });

    it('decimal: should clear on empty and revert invalid values', () => {
      directive.allowText = 'decimal';
      directive.lastValue = '1.2' as any;
      const empty = event('');
      directive.onInput(empty);
      expect(empty.target.value).toBe('');

      directive.lastValue = '1.23' as any;
      const bad = event('1.234');
      directive.onInput(bad);
      expect(bad.target.value).toBe('1.23');
    });

    it('number: should block a leading zero', () => {
      directive.allowText = 'number';
      directive.lastValue = '' as any;
      const e = event('0');
      directive.onInput(e);
      expect(e.target.value).toBe('');
    });

    it('number: should accept digits', () => {
      directive.allowText = 'number';
      directive.lastValue = '1' as any;
      const e = event('12');
      directive.onInput(e);
      expect(e.target.value).toBe('12');
    });
  });

  it('onFocus should remember the current value', () => {
    directive.onFocus({ target: { value: 'xyz' } });
    expect(directive.lastValue).toBe('xyz' as any);
  });

  it('findDelta should return inserted characters', () => {
    expect(directive.findDelta('abXc', 'abc')).toBe('X');
    expect(directive.findDelta('abc', 'abc')).toBe('');
  });

  it('should block paste, copy and cut', () => {
    ['blockPaste', 'blockCopy', 'blockCut'].forEach((fn) => {
      const e = jasmine.createSpyObj('event', ['preventDefault']);
      (directive as any)[fn](e);
      expect(e.preventDefault).toHaveBeenCalled();
    });
  });

  describe('in a template', () => {
    let fixture: ComponentFixture<HostComponent>;
    let input: HTMLInputElement;

    beforeEach(() => {
      TestBed.configureTestingModule({
        declarations: [HostComponent, StringValidatorDirective],
      });
      fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      input = fixture.debugElement.query(By.css('input')).nativeElement;
    });

    it('should revert non-numeric input on the host element', () => {
      input.value = '12';
      input.dispatchEvent(new Event('focus'));
      input.value = '12a';
      input.dispatchEvent(new Event('input'));
      expect(input.value).toBe('12');
    });

    it('should prevent paste on the host element', () => {
      const e = new Event('paste', { cancelable: true });
      input.dispatchEvent(e);
      expect(e.defaultPrevented).toBeTrue();
    });
  });
});
