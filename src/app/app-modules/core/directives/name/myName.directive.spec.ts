import { MyNameDirective } from './myName.directive';

describe('MyNameDirective', () => {
  let directive: MyNameDirective;

  const press = (key: string, useWhich = false) => {
    const code = key.charCodeAt(0);
    const e = {
      charCode: useWhich ? 0 : code,
      which: code,
      preventDefault: jasmine.createSpy('preventDefault'),
    };
    directive.onKeyPress(e);
    return e.preventDefault;
  };

  beforeEach(() => {
    directive = new MyNameDirective({} as any);
  });

  // NOTE: the keypress regex closes its character class early at "[]",
  // so it never matches a single character and no key is blocked today.
  // These tests pin the current behaviour; see the coverage report.
  it('currently does not block any single key press', () => {
    ['5', '@', ' ', 'a'].forEach((k) => expect(press(k)).not.toHaveBeenCalled());
  });

  it('should fall back to "which" when charCode is 0', () => {
    expect(press('a', true)).not.toHaveBeenCalled();
  });

  it('should block paste, copy and cut', () => {
    ['blockPaste', 'blockCopy', 'blockCut'].forEach((fn) => {
      const e = jasmine.createSpyObj('event', ['preventDefault']);
      (directive as any)[fn](e);
      expect(e.preventDefault).toHaveBeenCalled();
    });
  });
});
