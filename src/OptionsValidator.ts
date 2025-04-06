interface ValidatorParams {
  required: string[];
}

interface ValidatorOptions {
  [key: string]: any;
}

export class OptionsValidator {
  private requiredOptions: string[];

  constructor(params: ValidatorParams) {
    if (!this.validateParams(params)) {
      throw new Error('-- OptionsValidator: required options missing');
    }

    this.requiredOptions = params.required;
  }

  public getRequiredOptions(): string[] {
    return this.requiredOptions;
  }

  public validate(parameters: ValidatorOptions): string[] {
    const errors: string[] = [];
    this.requiredOptions.forEach((requiredOptionName: string) => {
      if (typeof parameters[requiredOptionName] === 'undefined') {
        errors.push(requiredOptionName);
      }
    });
    return errors;
  }

  private validateParams(params: ValidatorParams): boolean {
    if (!params) {
      return false;
    }
    return typeof params.required !== 'undefined' && Array.isArray(params.required);
  }
} 