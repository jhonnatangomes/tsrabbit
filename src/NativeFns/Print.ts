import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import { Literal } from '../Token';

export default class Print extends Callable {
  arity() {
    return Infinity;
  }

  call(_interpreter: Interpreter, args: Literal[]): Literal {
    console.log(...args);
    return null;
  }
}
