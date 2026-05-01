const path = require('path');
const fs = require('fs');
const env = require('./env');
const logger = require('../utils/logger');

const ensureLocalDir = () => {
  const dir = path.resolve(env.LOCAL_UPLOAD_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created local upload directory: ${dir}`);
  }
  return dir;
};

const uploadFile = async (buffer, filename) => {
  const dir = ensureLocalDir();
  const uniqueName = `${Date.now()}-${filename}`;
  const filePath = path.join(dir, uniqueName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${uniqueName}`;
};

const deleteFile = async (fileUrl) => {
  const filePath = path.resolve(`.${fileUrl}`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

module.exports = { uploadFile, deleteFile };