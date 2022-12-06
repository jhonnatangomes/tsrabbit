console.time();

function fibonnaci(n) {
  if (n == 0) return 0;
  if (n == 1) return 1;
  return fibonnaci(n - 1) + fibonnaci(n - 2);
}
fibonnaci(30);

console.timeEnd();
