import { Module, Global } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { FileUploadService } from './services/file-upload.service';

@Global()
@Module({
  providers: [EmailService, FileUploadService],
  exports: [EmailService, FileUploadService],
})
export class SharedModule {}
