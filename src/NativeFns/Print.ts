import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import RabbitFunction from '../RabbitFunction';
import { Literal } from '../Token';

export default class Print extends Callable {
  arity() {
    return Infinity;
  }

  call(_interpreter: Interpreter, args: Literal[]): Literal {
    console.log(...args.map(this.stringify));
    return null;
  }

  private stringify(value: Literal) {
    if (value === null) return 'nil';
    if (typeof value === 'number') {
      const text = value.toString();
      if (text.endsWith('.0')) {
        return text.replace('.0', '');
      }
      return text;
    }
    if (value instanceof RabbitFunction) {
      return value.declaration.code;
    }

    return value;
  }
}
