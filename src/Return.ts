import { Literal } from './Token';

export default class Return extends Error {
  value: Literal;

  constructor(value: Literal) {
    super();
    this.value = value;
  }
}
