import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { getRepository } from 'typeorm';

interface IObject {
  [key: string]: any;
}

@ValidatorConstraint({ async: true, name: 'IsFrozenWhenPreset' })
export class IsFrozenWhenPresetConstraint
  implements ValidatorConstraintInterface {
  public async validate(value: any, args: ValidationArguments) {
    const object: IObject = args.object;
    if (!object.id) {
      return true;
    }

    const { targetName, property } = args;
    const repository = getRepository<any>(targetName);
    const entity: IObject | undefined = await repository.findOne(object.id);

    return !entity || !entity[property] || entity[property] === value;
  }
}

/**
 * Checks if a field can be set for a first time
 *
 * @param validationOptions `class-validator` options
 */
export const IsFrozenWhenPreset = (validationOptions?: ValidationOptions) => {
  const options: ValidationOptions = {
    message: 'Value is not allowed to be changed',
    ...validationOptions,
  };

  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsFrozenWhenPresetConstraint,
    });
  };
};
