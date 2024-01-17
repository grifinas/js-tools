import { Options } from 'yargs';
import { InvalidStageError } from './errors';

export const stageOption = {
  choices: ['beta', 'gamma', 'prod'],
  type: 'string',
  alias: 's',
  default: 'beta',
  describe: 'what staging account to ada-auth into (default is beta)'
} as const;

export const noErrorOption = option({
  boolean: true,
  default: false,
  describe: 'Whether to print errors to console'
});

export function setStage(stage: string) {
  const loweredStage = stage.toLowerCase();
  //@ts-ignore
  if (stageOption.choices.includes(loweredStage)) {
    process.env['stage'] = stage;
    return;
  }

  throw new InvalidStageError(`Invalid stage supplied: ${stage}, allowed options: ${JSON.stringify(stageOption.choices)}`);
}

export function getStage(): string {
  return process.env['stage'] || 'beta';
}

export function withStage<T extends Record<string, Options>>(options: T): T & {stage: typeof stageOption} {
  return {
    ...options,
    stage: stageOption
  }
}

// class Example<T extends string> {
//   get foo(): Example<T | 'foo'> {
//     // @ts-ignore
//     return this;
//   }
//
//   get bar(): Example<T | 'bar'> {
//     // @ts-ignore
//     return this;
//   }
//
//   build(): {[key in T]: boolean} {
//     // @ts-ignore
//     return {};
//   }
// }
// const example = new Example();
// const test1 = example.foo.build(); //{foo: boolean}
// const test2 = example.foo.bar.build(); //{bar: boolean, foo: boolean}
// const test3 = {
//   ...example.bar.foo.build()
// }; //{bar: boolean, foo: boolean}
// const test4 = {
//   baz: true,
//   ...example.foo.bar.build(),
// };


// class OptionBuilder<T extends string> {
//   private options: Record<string, Options> = {}
//
//   add<U extends Record<string, boolean>>(options: U): U & {[key in T]: boolean}  {
//     return {
//       ...options,
//       ...this.options
//     }
//   }
//
//   qqq(): {[key in T]: boolean} {
//     // @ts-ignore
//     return this.options as {[key in T]: boolean};
//   }
//
//   get stage(): OptionBuilder<T|'stage'> {
//     this.options['stage'] = stageOption;
//     return this;
//   }
//
//   get noerr(): OptionBuilder<T|'noerr'> {
//     this.options['noerr'] = noErrorOption;
//     return this;
//   }
// }


// export const withOptions = new OptionBuilder();
// // const foo = withOptions.noerr.stage.add({foo: true});
// // foo;
// const foo = withOptions.stage.noerr.qqq();
// foo.


//Just for type-hinting
export function option<T extends Options>(obj: T): T {
  return obj;
}