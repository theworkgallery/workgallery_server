const crypto = require('crypto');
const generateFileName = (mimeType, bytes = 32) => {
  const extension = mimeType.split('/')[1]; // Extracts file extension from MIME type
  return crypto.randomBytes(bytes).toString('hex') + '.' + extension;
};

const ArrayFilter = ({
  arr = [],
  property,
  condition = () => true, // default to a function that always returns true
}) => {
  if (!Array.isArray(arr)) return [];
  if (typeof property !== 'string' || property === '') return arr;
  return arr.filter((each) => {
    if (typeof each[property] === 'undefined') return false;
    return typeof condition === 'function'
      ? condition(each[property])
      : each[property] === condition;
  });
};

module.exports = {
  ArrayFilter,
  generateFileName,
};
