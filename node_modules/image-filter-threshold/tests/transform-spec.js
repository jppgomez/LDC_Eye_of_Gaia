const expect = require('chai').expect;
const transform = require('../src/transform');

describe('threshold', function() {
    it('should apply transformation and return as imageData', function() {
        const data = [
            193,
            219,
            242,
            255,
            255,
            219,
            242,
            255
        ];

        const expectedData = [ 0, 0, 0, 255, 255, 255, 255, 255 ];

        transform(data, 8, { threshold: 216 });

        expect(data).to.deep.equal(expectedData);
    });
});
