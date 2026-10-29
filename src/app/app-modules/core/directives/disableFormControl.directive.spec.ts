import { FormControl, FormGroup } from '@angular/forms';
import { DisableFormControlDirective } from './disableFormControl.directive';

describe('DisableFormControlDirective', () => {
  let group: FormGroup;
  let control: FormControl;
  let directive: DisableFormControlDirective;

  beforeEach(() => {
    control = new FormControl('value');
    group = new FormGroup({ field: control, other: new FormControl('o') });
    directive = new DisableFormControlDirective({ control } as any);
  });

  it('should clear and disable the control when condition is true', () => {
    directive.disableFormControl = true;
    expect(control.disabled).toBeTrue();
    expect(control.value).toBeNull();
    expect(control.touched).toBeTrue();
  });

  it('should enable the control when condition is false', () => {
    control.disable();
    directive.disableFormControl = false;
    expect(control.enabled).toBeTrue();
    expect(control.value).toBe('value');
  });

  // Disabling a group's only control disables the group itself, so the
  // directive treats the parent as disabled and never re-enables it.
  it('cannot re-enable when it is the only control in the group', () => {
    const only = new FormControl('v');
    new FormGroup({ only });
    const d = new DisableFormControlDirective({ control: only } as any);
    d.disableFormControl = true;
    d.disableFormControl = false;
    expect(only.disabled).toBeTrue();
  });

  it('should keep the value when the parent is already disabled', () => {
    group.disable();
    directive.disableFormControl = false;
    expect(control.disabled).toBeTrue();
    expect(control.value).toBe('value');
  });

  it('should do nothing when control has no parent', () => {
    const orphan = new FormControl('v');
    const d = new DisableFormControlDirective({ control: orphan } as any);
    d.disableFormControl = true;
    expect(orphan.enabled).toBeTrue();
    expect(orphan.value).toBe('v');
  });

  it('should do nothing when NgControl has no control', () => {
    const d = new DisableFormControlDirective({ control: null } as any);
    expect(() => (d.disableFormControl = true)).not.toThrow();
  });
});
