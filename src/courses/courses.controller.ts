import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { Request } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../shared/services/file-upload.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT)
  async getAllCourses(@Req() req: Request, @Query() query: PaginationQueryDto) {
    return this.coursesService.findAll(req.user['id'], query.page, query.limit);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @Req() req: Request,
  ) {
    return this.coursesService.create(createCourseDto, req.user['id']);
  }

  @Get(':courseId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT)
  async getCourse(@Param('courseId') courseId: string, @Req() req: Request) {
    return this.coursesService.findById(courseId, req.user['id']);
  }

  @Get(':courseId/sections')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT)
  async getCourseSections(
    @Param('courseId') courseId: string,
    @Req() req: Request,
  ) {
    return this.coursesService.findSections(courseId, req.user['id']);
  }

  @Post(':courseId/sections')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  async createSection(
    @Param('courseId') courseId: string,
    @Body() createSectionDto: CreateSectionDto,
    @Req() req: Request,
  ) {
    return this.coursesService.createSection(
      courseId,
      createSectionDto,
      req.user['id'],
      req.user['role'],
    );
  }

  @Get(':courseId/sections/:sectionId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT)
  async getCourseSection(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Req() req: Request,
  ) {
    return this.coursesService.findSection(courseId, sectionId, req.user['id']);
  }

  @Post(':courseId/sections/:sectionId/lectures')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  async createLecture(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() createLectureDto: CreateLectureDto,
    @Req() req: Request,
  ) {
    return this.coursesService.createLecture(
      courseId,
      sectionId,
      createLectureDto,
      req.user['id'],
      req.user['role'],
    );
  }

  @Post(':courseId/upload_thumbnail')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('thumbnail'))
  async uploadThumbnail(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ })],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    await this.coursesService.checkCourseAccess(
      courseId,
      req.user['id'],
      req.user['role'],
    );
    const thumbnailPath = await this.fileUploadService.uploadThumbnail(
      courseId,
      file,
    );
    return this.coursesService.updateThumbnail(courseId, thumbnailPath);
  }

  @Post(':courseId/sections/:sectionId/lectures/:lectureId/upload_resources')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @UseInterceptors(FilesInterceptor('resources', 10))
  async uploadResources(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lectureId') lectureId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), //25MB max file size
          new FileTypeValidator({ fileType: /(pdf|png|jpeg|jpg|docx|csv)$/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    await this.coursesService.checkCourseAccess(
      courseId,
      req.user['id'],
      req.user['role'],
    );
    const resourcePaths = await this.fileUploadService.uploadResources(
      courseId,
      sectionId,
      lectureId,
      files,
    );
    return this.coursesService.updateLectureResources(
      courseId,
      sectionId,
      lectureId,
      resourcePaths,
      req.user['id'],
    );
  }

  @Post(':courseId/sections/:sectionId/lectures/:lectureId/upload_video')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lectureId') lectureId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /(mp4|avi)$/ })],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    await this.coursesService.checkCourseAccess(
      courseId,
      req.user['id'],
      req.user['role'],
    );
    const videoPath = await this.fileUploadService.uploadVideo(
      courseId,
      sectionId,
      lectureId,
      file,
    );
    return this.coursesService.updateLectureVideo(
      courseId,
      sectionId,
      lectureId,
      videoPath,
      req.user['id'],
    );
  }

  @Get('search/:query')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT)
  async searchCourses(
    @Param('query') query: string,
    @Query() paginationQuery: PaginationQueryDto,
    @Req() req: Request,
  ) {
    return this.coursesService.searchCourses(
      query,
      req.user['id'],
      paginationQuery.page,
      paginationQuery.limit,
    );
  }
}
