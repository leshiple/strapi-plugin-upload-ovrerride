'use strict';
/**
 * Image manipulation functions
 */
const sharp = require('sharp');

const {
  generateThumbnail,
  optimize,
  getDimensions,
} = require('strapi-plugin-upload/services/image-manipulation');

const { bytesToKbytes } = require('strapi-plugin-upload/utils/file');

const getMetadatas = buffer =>
  sharp(buffer)
    .metadata()
    .catch(() => ({}));

const resizeTo = (buffer, options) =>
  sharp(buffer)
    .resize(options)
    .toBuffer()
    .catch(() => null);

const convertTo = (buffer, extension) =>
  sharp(buffer)
    .toFormat(extension)
    .toBuffer()
    .catch(() => null);

const getMime = (extension) => {
  const types = {
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };

  const isHasType = Object.hasOwnProperty.call(types, extension);

  if (isHasType) {
    return types[extension];
  }

  return false;
}

const generateResponsiveFormats = async file => {
  const {
    presets,
  } = strapi.plugins.upload.config;


  if (!(await canBeProccessed(file.buffer))) {
    return [];
  }

  const isNotHasPreset = !Object.hasOwnProperty.call(presets, file.preset);

  if (isNotHasPreset) {
    return [];
  }

  const preset = presets[file.preset];

  const formats = [];

  for (let item of preset) {
    const { extensions, name, fit, width, height } = item;
    for (let extension of extensions) {
      formats.push(generateBreakpoint(file, name, extension, fit, width, height));
    }
  }

  return Promise.all(formats);
};

const generateBreakpoint = async (file, name, extension, fit, width, height ) => {
  let newBuff = await resizeTo(file.buffer, {
    width,
    height,
    fit,
  });

  const [srcName, srcExtension] = file.name.split('.');

  if (srcExtension !== extension) {
    newBuff = await convertTo(newBuff, extension);
  }

  const { width: newWidth, height: newHeight, size } = await getMetadatas(newBuff);

  const key = `${name}-${extension}`;

  return {
    key,
    file: {
      name: `${key}_${srcName}.${extension}`,
      hash: `${key}_${file.hash}`,
      ext: `.${extension}`,
      mime: getMime(extension),
      width: newWidth,
      height: newHeight,
      size: bytesToKbytes(size),
      buffer: newBuff,
      path: file.path ? file.path : null,
    },
  };
};

const formatsToProccess = ['jpeg', 'png', 'webp'];
const canBeProccessed = async buffer => {
  const { format } = await getMetadatas(buffer);
  return format && formatsToProccess.includes(format);
};

module.exports = {
  getDimensions,
  generateResponsiveFormats,
  generateThumbnail,
  bytesToKbytes,
  optimize,
};
