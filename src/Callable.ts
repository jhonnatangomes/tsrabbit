import Interpreter from './Interpreter';
import Token, { Literal } from './Token';

export abstract class Callable {
  arity(): number {
    return 0;
  }
  call(_interpreter: Interpreter, _args: Literal[], _token: Token): Literal {
    return null;
  }
}
