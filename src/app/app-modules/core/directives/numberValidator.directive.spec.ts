import { NumberValidatorDirective } from './numberValidator.directive';

describe('NumberValidatorDirective', () => {
  let directive: NumberValidatorDirective;

  beforeEach(() => {
    directive = new NumberValidatorDirective({} as any);
    directive.allowMax = '100';
  });

  it('validate should accept values up to and including the max', () => {
    expect(directive.validate('99')).toBeTrue();
    expect(directive.validate('100')).toBeTrue();
    expect(directive.validate('')).toBeTrue();
  });

  it('validate should reject values above the max and non-numbers', () => {
    expect(directive.validate('101')).toBeFalse();
    expect(directive.validate('abc')).toBeFalse();
  });

  it('onInput should keep valid values', () => {
    const e = { target: { value: '50' } };
    directive.onInput(e);
    expect(e.target.value).toBe('50');
    expect(directive.lastValue).toBe('50' as any);
  });

  it('onInput should revert to last value when above max', () => {
    directive.onFocus({ target: { value: '10' } });
    const e = { target: { value: '1000' } };
    directive.onInput(e);
    expect(e.target.value).toBe('10');
  });

  it('should block paste, copy and cut', () => {
    ['blockPaste', 'blockCopy', 'blockCut'].forEach((fn) => {
      const e = jasmine.createSpyObj('event', ['preventDefault']);
      (directive as any)[fn](e);
      expect(e.preventDefault).toHaveBeenCalled();
    });
  });
});
