import { getRepository, Not, Repository } from 'typeorm';

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export type ScopedValidationOptions = ValidationOptions & { scope?: string[] };

@ValidatorConstraint({ async: true, name: 'IsUniq' })
export class IsUniqConstraint implements ValidatorConstraintInterface {
  public async validate(value: any, args: ValidationArguments) {
    const repository = getRepository<any>(args.targetName);
    if (args.value == null) return true;
    const entity = await repository.findOne({
      where: this.buildConditions(value, args, repository),
    });

    return !entity;
  }

  private buildConditions(
    value: any,
    args: ValidationArguments,
    repository: Repository<{}>,
  ) {
    return {
      [args.property]: value,
      ...this.buildScopeConditions(args.object, args.constraints),
      ...this.buildPrimaryColumnConditions(args.object, repository),
    };
  }

  private buildScopeConditions(object: any, constraints?: string[]) {
    if (!constraints || !constraints.length) {
      return {};
    }
    return constraints.reduce(
      (acc, key) => ({
        ...acc,
        [key]: object[key],
      }),
      {},
    );
  }

  private buildPrimaryColumnConditions(
    object: any,
    repository: Repository<{}>,
  ) {
    const primaryColumnNames = repository.metadata.primaryColumns.map(
      ({ propertyName }) => propertyName,
    );

    if (!primaryColumnNames.length) {
      return {};
    }
    return primaryColumnNames.reduce((acc, name) => {
      const pkValue = object[name];
      return pkValue ? { ...acc, [name]: Not(pkValue) } : acc;
    }, {});
  }
}

/**
 * Checks if a value is uniq across all records in a database or inside a scope.
 *
 * @param validationOptions accept `scope` options and all `class-validator` options
 */
export const IsUniq = (validationOptions?: ScopedValidationOptions) => {
  return (object: object, propertyName: string) => {
    const scope = validationOptions && validationOptions.scope;
    const opts: ScopedValidationOptions = {
      message: scope
        ? `$target with $property '$value' already exists in scope: ${scope.join(
            ', ',
          )}`
        : "$target with $property '$value' already exists",
      ...validationOptions,
    };
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: opts,
      constraints: scope || [],
      validator: IsUniqConstraint,
    });
  };
};
