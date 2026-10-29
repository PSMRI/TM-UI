import { FormControl } from '@angular/forms';
import { MyEmailDirective } from './myEmail.directive';

describe('MyEmailDirective', () => {
  const directive = new MyEmailDirective();
  const check = (v: any) => directive.validate(new FormControl(v));

  it('should accept valid emails', () => {
    expect(check('john.doe@gmail.com')).toBeNull();
    expect(check('a_b@piramal.org')).toBeNull();
    expect(check('x@site.in')).toBeNull();
    expect(check('X@SITE.COM')).toBeNull();
  });

  it('should treat empty and null as valid (optional field)', () => {
    expect(check('')).toBeNull();
    expect(check(null)).toBeNull();
  });

  it('should reject malformed emails', () => {
    expect(check('no-at-sign.com')).toEqual({ valid: false });
    expect(check('a@b')).toEqual({ valid: false });
    expect(check('a@b.net')).toEqual({ valid: false });
    expect(check('a b@c.com')).toEqual({ valid: false });
    expect(check('a@1.com')).toEqual({ valid: false });
  });

  it('should block paste, copy and cut', () => {
    ['blockPaste', 'blockCopy', 'blockCut'].forEach((fn) => {
      const e = jasmine.createSpyObj('event', ['preventDefault']);
      (directive as any)[fn](e);
      expect(e.preventDefault).toHaveBeenCalled();
    });
  });
});
