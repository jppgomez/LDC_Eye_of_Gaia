/**
 * Iterate over the array applying the threshold transformation
 * @name transform
 * @param {Array} data
 * @param {Number} length
 * @param {Object} options
 */
module.exports = function transform (data, length, options) {
    for (var i = 0; i < length; i += 4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];
        var v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= options.threshold) ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = v;
    }
};
