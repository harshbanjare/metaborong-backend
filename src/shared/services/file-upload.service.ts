import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private s3: S3;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    this.bucket = bucket;

    this.s3 = new S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });
  }

  private readonly allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg']; //allowed image types: png, jpeg, jpg
  private readonly allowedResourceTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
  ]; //allowed resource types: pdf, png, jpeg, docx, csv

  private readonly allowedVideoTypes = ['video/mp4', 'video/x-msvideo']; //allowed video types: mp4, avi
  private readonly maxResourceSize = 25 * 1024 * 1024; // 25MB

  private validateFile(
    file: Express.Multer.File,
    allowedTypes: string[],
    maxSize?: number,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    if (maxSize && file.size > maxSize) {
      throw new BadRequestException(
        `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
      );
    }
  }

  private async uploadToS3(
    file: Express.Multer.File,
    path: string,
  ): Promise<string> {
    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    const fullPath = `${path}/${uniqueFileName}`;

    await this.s3
      .upload({
        Bucket: this.bucket,
        Key: fullPath,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    return fullPath;
  }

  async uploadThumbnail(courseId: string, file: Express.Multer.File) {
    this.validateFile(file, this.allowedImageTypes);
    return this.uploadToS3(file, `${courseId}`);
  }

  async uploadResources(
    courseId: string,
    sectionId: string,
    lectureId: string,
    files: Express.Multer.File[],
  ) {
    const uploadedPaths: string[] = [];

    for (const file of files) {
      this.validateFile(file, this.allowedResourceTypes, this.maxResourceSize);
      const path = await this.uploadToS3(
        file,
        `${courseId}/${sectionId}/${lectureId}/resources`,
      );
      uploadedPaths.push(path);
    }

    return uploadedPaths;
  }

  async uploadVideo(
    courseId: string,
    sectionId: string,
    lectureId: string,
    file: Express.Multer.File,
  ) {
    this.validateFile(file, this.allowedVideoTypes);
    return this.uploadToS3(file, `${courseId}/${sectionId}/${lectureId}/video`);
  }

  async getSignedUrl(key: string): Promise<string> {
    try {
      const signedUrl = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: 21600,
      });

      return signedUrl;
    } catch (error) {
      throw new BadRequestException('Error generating signed URL');
    }
  }

  async getMultipleSignedUrls(keys: string[]): Promise<string[]> {
    return Promise.all(keys.map((key) => this.getSignedUrl(key)));
  }
}
