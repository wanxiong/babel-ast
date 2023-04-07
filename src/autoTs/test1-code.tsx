type Res<Param> = Param extends 1 ? number : string;
function add<T>(a: T, b: T) {
    return a + b;
}
add<Res<1>>(1, '2');