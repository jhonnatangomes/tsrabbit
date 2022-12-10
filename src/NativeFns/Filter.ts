import { Callable } from '../Callable';
import { isNotFalse } from '../helpers';
import Interpreter from '../Interpreter';
import RabbitFunction from '../RabbitFunction';
import RuntimeError from '../RuntimeError';
import Token, { Literal } from '../Token';

export default class Filter extends Callable {
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
    if (fn.arity() < 1 || fn.arity() > 2) {
      throw new RuntimeError(
        token,
        'Callback function needs to have 1 or 2 parameters.'
      );
    }
    return array.filter((v, i) =>
      fn.call(interpreter, [v, fn.arity() === 2 && i].filter(isNotFalse))
    );
  }
}
