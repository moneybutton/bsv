var Benchmarking = require('./benchmarking')

/*
Sign#NumInputs1 x 204 ops/sec ±4.60% (84 runs sampled)
Sign#NumInputs10 x 27.40 ops/sec ±0.92% (49 runs sampled)
Sign#NumInputs20 x 13.99 ops/sec ±0.78% (39 runs sampled)
Sign#NumInputs30 x 8.98 ops/sec ±1.33% (27 runs sampled)
Create#NumInputs1 x 12,780 ops/sec ±2.26% (90 runs sampled)
Create#NumInputs10 x 2,628 ops/sec ±0.49% (94 runs sampled)
Create#NumInputs20 x 1,336 ops/sec ±0.87% (94 runs sampled)
Create#NumInputs30 x 877 ops/sec ±0.67% (90 runs sampled)
CreateAndSign#NumInputs1 x 212 ops/sec ±0.98% (82 runs sampled)
CreateAndSign#NumInputs10 x 27.41 ops/sec ±0.53% (49 runs sampled)
CreateAndSign#NumInputs20 x 13.63 ops/sec ±0.68% (38 runs sampled)
CreateAndSign#NumInputs30 x 8.90 ops/sec ±1.30% (26 runs sampled)
*/
// Benchmarking.signNumInputs([1, 10, 20, 30])
// Benchmarking.createNumInputs([1, 10, 20, 30])
Benchmarking.createAndSignNumInputs([1, 10, 20, 30])

/*
Create#NumInputs1 x 12,796 ops/sec ±4.60% (90 runs sampled)
Create#NumInputs10 x 2,651 ops/sec ±0.97% (93 runs sampled)
Create#NumInputs100 x 230 ops/sec ±0.69% (83 runs sampled)
Create#NumInputs1000 x 7.08 ops/sec ±2.94% (22 runs sampled)
Create#NumInputs2000 x 2.06 ops/sec ±0.95% (10 runs sampled)
Create#NumInputs3000 x 0.95 ops/sec ±1.27% (7 runs sampled)
*/
// Benchmarking.createNumInputs([1, 10, 100, 1000, 2000, 3000])
