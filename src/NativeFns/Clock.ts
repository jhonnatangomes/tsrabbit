import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import { Literal } from '../Token';

export default class Clock extends Callable {
  startTime: Date | null = null;

  private startClock() {
    this.startTime = new Date();
  }

  private stopClock() {
    const startTime = this.startTime as Date;
    const endTime = new Date();
    this.startTime = null;
    return endTime.getTime() - startTime.getTime();
  }

  arity() {
    return 0;
  }

  call(_interpreter: Interpreter, _args: Literal[]) {
    if (this.startTime === null) {
      this.startClock();
      return null;
    } else {
      return this.stopClock();
    }
  }
}
