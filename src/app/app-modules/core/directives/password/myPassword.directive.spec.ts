import { MyPasswordDirective } from './myPassword.directive';

describe('MyPasswordDirective', () => {
  let directive: MyPasswordDirective;

  const keyup = (value: string) => {
    const hint = { innerHTML: '' };
    const target: any = {
      value,
      style: { border: '' },
      nextSibling: { nextElementSibling: hint },
    };
    directive.onKeyUp({ target });
    return { hint, target };
  };

  beforeEach(() => {
    directive = new MyPasswordDirective({} as any);
  });

  it('should mark an 8-12 char password starting with a letter as strong', () => {
    const { hint, target } = keyup('Abc12345');
    expect(hint.innerHTML).toBe('Strong Password');
    expect(target.style.border).toBe('2px solid green');
  });

  it('should accept allowed special characters', () => {
    expect(keyup('Abc$%#@!12').hint.innerHTML).toBe('Strong Password');
  });

  it('should reject a password starting with a digit', () => {
    const { hint, target } = keyup('1abcdefg');
    expect(hint.innerHTML).toContain('8-12 characters');
    expect(target.style.border).toBe('2px solid red');
  });

  it('should reject too short and too long passwords', () => {
    expect(keyup('Abc1234').target.style.border).toBe('2px solid red');
    expect(keyup('Abcdefghijklm').target.style.border).toBe('2px solid red');
  });

  // NOTE: the regex already enforces 8+ chars, so the "Weak Password"
  // branch in passwordValidator is unreachable with the current code.
  it('never reports a weak password (unreachable branch)', () => {
    ['Abcdefgh', 'Abcdefghijkl', 'A1234567'].forEach((p) =>
      expect(keyup(p).hint.innerHTML).not.toBe('Weak Password'),
    );
  });

  it('should block whitespace key presses', () => {
    const e = { charCode: 32, preventDefault: jasmine.createSpy() };
    directive.onKeyPress(e);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('should allow non-whitespace key presses (uses which when no charCode)', () => {
    const e = { charCode: 0, which: 65, preventDefault: jasmine.createSpy() };
    directive.onKeyPress(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('should block paste, copy and cut', () => {
    ['blockPaste', 'blockCopy', 'blockCut'].forEach((fn) => {
      const e = jasmine.createSpyObj('event', ['preventDefault']);
      (directive as any)[fn](e);
      expect(e.preventDefault).toHaveBeenCalled();
    });
  });
});
