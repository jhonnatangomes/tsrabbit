export type Line = {
  number: number;
  column: number;
  line: string;
};

export let hadError = false;

export function lineObject(source: string, start: number): Line {
  const lines = source.slice(0, start + 1).split('\n');
  const lineNumber = lines.length;
  const visibleChars = lines
    .slice(0, -1)
    .reduce((prev, curr) => prev + curr.length + 1, 0);
  const column = start + 1 - visibleChars;
  return {
    number: lineNumber,
    line: source.split('\n').at(lineNumber - 1) || '',
    column,
  };
}
export function lineError(line: Line, message: string) {
  report(line, '', message);
}

export function report(line: Line, where: string, message: string) {
  const { number, column, line: lineString } = line;
  console.log(`[line ${number}:${column}] Error${where}: ${message}`);
  console.log(`  ${number} | ${lineString}`);
  console.log(
    new Array(lineString.length)
      .fill('')
      .map((_, i) => (i === column - 1 ? '^' : ' '))
      .join('')
      .padStart(lineString.length + 5 + number.toString().length)
  );
  hadError = true;
}
export function resetError() {
  hadError = false;
}
