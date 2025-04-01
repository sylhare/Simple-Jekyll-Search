import { describe, it, expect } from 'vitest';
import { OptionsValidator } from '../src/OptionsValidator';

describe('OptionsValidator', () => {
  it('can be instanciated with options', () => {
    const requiredOptions = ['foo', 'bar'];
    const optionsValidator = new OptionsValidator({
      required: requiredOptions
    });

    expect(optionsValidator.getRequiredOptions()).toEqual(requiredOptions);
  });

  it('returns empty errors array for valid options', () => {
    const requiredOptions = ['foo', 'bar'];
    const optionsValidator = new OptionsValidator({
      required: requiredOptions
    });

    const errors = optionsValidator.validate({
      foo: '',
      bar: ''
    });

    expect(errors.length).toBe(0);
  });

  it('returns array with errors for invalid options', () => {
    const requiredOptions = ['foo', 'bar'];
    const optionsValidator = new OptionsValidator({
      required: requiredOptions
    });

    const errors = optionsValidator.validate({
      foo: ''
    });

    expect(errors.length).toBe(1);
  });
}); 