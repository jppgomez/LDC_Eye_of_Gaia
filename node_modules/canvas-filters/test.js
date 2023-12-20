let ImageFilters = require('./imagefilters');

// console.info(ImageFilters);

// ImageFilters.utils.rgbToHsl();
let rgb = ImageFilters.utils.hslToRgb(0.1111111111111111, 1, 0.9529411764705882);
console.info('rgb:', rgb);

let hsl = ImageFilters.utils.rgbToHsl(255, 247, 231);
console.info('hsl:', hsl);