import Interpreter from './Interpreter';
import { Literal } from './Token';

// export interface CallableInterface {
//   call: (interpreter: Interpreter, args: Literal[]) => Literal;
//   arity: () => number;
// }

export abstract class Callable {
  arity(): number {
    return 0;
  }
  call(interpreter: Interpreter, args: Literal[]): Literal {
    return null;
  }
}
