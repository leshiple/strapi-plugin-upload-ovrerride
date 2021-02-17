const UploadService = require('strapi-plugin-upload/services/Upload');

UploadService.upload = async function({ data, files }, { user } = {}) {
  const { fileInfo, ...metas } = data;

  const fileArray = Array.isArray(files) ? files : [files];
  const fileInfoArray = Array.isArray(fileInfo) ? fileInfo : [fileInfo];

  const doUpload = async (file, fileInfo) => {
    const fileData = await this.enhanceFile(file, fileInfo, metas);

    return this.uploadFileAndPersist(Object.assign(data, fileData), { user });
  };

  return await Promise.all(
    fileArray.map((file, idx) => doUpload(file, fileInfoArray[idx] || {}))
  );
};
module.exports = UploadService;
