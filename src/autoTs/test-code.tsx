let name: string;

name = 111;


function add(a: number, b: number): number{
  return a + b;
}
add(1, '2');



function add1<T>(a: T, b: T) {
  return a + b;
}
add1<number>(1, '2');