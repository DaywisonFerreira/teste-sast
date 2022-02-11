import { HttpException, HttpStatus } from '@nestjs/common';

export const EditFileName = (_: unknown, file: any, callback) => {
  const randomName = Array(8)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `carrier-logo-${randomName}`);
};

export const FileFilter = (_: unknown, file, callback) => {
  if (!file.originalname.match(/\.(png|jpeg|jpg|apng)$/)) {
    return callback(
      new HttpException(
        'Only png | jpeg | jpg | apng Files are allowed!',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
  return callback(null, true);
};
