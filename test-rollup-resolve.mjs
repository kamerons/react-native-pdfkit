import { rollup } from 'rollup';

const bundle = await rollup({
  input: 'lib/font_factory.js',
  plugins: []
});

console.log('Bundle created successfully');
