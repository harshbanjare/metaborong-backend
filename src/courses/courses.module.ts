import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course, CourseSchema } from './schemas/course.schema';
import { FileUploadService } from '../shared/services/file-upload.service';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService, FileUploadService],
  exports: [CoursesService],
})
export class CoursesModule {}
