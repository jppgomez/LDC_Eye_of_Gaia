var imageFilterCore = require('image-filter-core');
var transform = require('./transform');

/**
 * @name threshold
 * @param {ImageData} data - data of a image extracted from a canvas
 * @param {Object} options - options to pass to the transformation function
 * @param {Number} [options.threshold] - threshold to apply in the transformation
 * @param {Number} nWorkers - number of workers
 * @returns {Promise}
 */
module.exports =  function threshold(data, options, nWorkers) {
    if (!data || !options || !options.threshold) {
        throw new Error('image-filter-threshold:: invalid options provided');
    }

    return imageFilterCore.apply(data, transform, options, nWorkers);
};
