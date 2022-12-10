import { Callable } from '../Callable';
import { isNotFalse } from '../helpers';
import Interpreter from '../Interpreter';
import RabbitFunction from '../RabbitFunction';
import RuntimeError from '../RuntimeError';
import Token, { Literal } from '../Token';

export default class Reduce extends Callable {
  arity() {
    return 2;
  }

  call(interpreter: Interpreter, args: Literal[], token: Token): Literal {
    if (!Array.isArray(args[0]))
      throw new RuntimeError(token, 'First parameter should be an array.');
    if (!(args[1] instanceof RabbitFunction)) {
      throw new RuntimeError(token, 'Second parameter should be a function.');
    }
    const [array, fn] = args;
    if (fn.arity() < 2 || fn.arity() > 3) {
      throw new RuntimeError(
        token,
        'Callback function needs to have 2 or 3 parameters.'
      );
    }
    return array.reduce((prev, acc, i) =>
      fn.call(
        interpreter,
        [prev, acc, fn.arity() === 3 && i].filter(isNotFalse)
      )
    );
  }
}
