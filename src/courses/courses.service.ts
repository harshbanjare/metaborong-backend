import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from './schemas/course.schema';
import { Section } from './schemas/section.schema';
import { Lecture } from './schemas/lecture.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { User } from '../users/schemas/user.schema';
import { FileUploadService } from '../shared/services/file-upload.service';
import { PaginatedResponse } from '../shared/interfaces/paginated-response.interface';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Course>> {
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.courseModel
        .find()
        .populate(
          'instructor',
          '-password -refreshToken -enrolledCourses -role -__v -email -createdAt -updatedAt',
        )
        .skip(skip)
        .limit(limit),
      this.courseModel.countDocuments(),
    ]);

    const user = await this.userModel.findById(userId);

    //check if user is enrolled in the course
    for (const course of courses) {
      if (!user.enrolledCourses.includes(course._id.toString())) {
        course.sections.forEach((section) => {
          section.lectures = [];
        });
      }
    }

    //get temporary signed url for all resources
    for (const course of courses) {
      course.thumbnail = await this.fileUploadService.getSignedUrl(
        course.thumbnail,
      );

      for (const section of course.sections) {
        for (const lecture of section.lectures) {
          lecture.resourceUrls =
            await this.fileUploadService.getMultipleSignedUrls(
              lecture.resourceUrls,
            );

          lecture.videoUrl = await this.fileUploadService.getSignedUrl(
            lecture.videoUrl,
          );
        }
      }
    }

    return {
      items: courses,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findById(id: string, userId: string): Promise<Course> {
    const course = await this.courseModel
      .findById(id)
      .populate(
        'instructor',
        '-password -refreshToken -enrolledCourses -role -__v -email -createdAt -updatedAt',
      );

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // WTH AM I EVEN DOING HERE

    //check if user is enrolled in the course
    const user = await this.userModel.findById(userId);
    if (!user.enrolledCourses.includes(course._id.toString())) {
      course.sections.forEach((section) => {
        section.lectures = [];
      });
    }

    //get temprory signed url for all resources
    course.thumbnail = await this.fileUploadService.getSignedUrl(
      course.thumbnail,
    );

    for (const section of course.sections) {
      for (const lecture of section.lectures) {
        lecture.resourceUrls =
          await this.fileUploadService.getMultipleSignedUrls(
            lecture.resourceUrls,
          );

        lecture.videoUrl = await this.fileUploadService.getSignedUrl(
          lecture.videoUrl,
        );
      }
    }

    return course;
  }

  async findSections(courseId: string, userId: string) {
    const course = await this.findById(courseId, userId);
    return course.sections;
  }

  async findSection(courseId: string, sectionId: string, userId: string) {
    const course = await this.findById(courseId, userId);
    const section = course.sections.find((s) => s._id.toString() === sectionId);

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    section.lectures = [];

    return section;
  }

  async create(
    createCourseDto: CreateCourseDto,
    userId: string,
  ): Promise<Course> {
    const course = await this.courseModel.create({
      ...createCourseDto,
      instructor: userId,
    });

    return course.populate('instructor', '-password -refreshToken');
  }

  async createSection(
    courseId: string,
    createSectionDto: CreateSectionDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Course> {
    const course = await this.findById(courseId, userId);

    if (
      userRole !== UserRole.ADMIN &&
      course.instructor.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You are not authorized to modify this course',
      );
    }

    const section = {
      _id: new Types.ObjectId(),
      ...createSectionDto,
      lectures: [],
    } as Section;

    await this.courseModel.findByIdAndUpdate(
      courseId,
      {
        $push: { sections: section },
      },
      { new: true },
    );

    return this.findById(courseId, userId);
  }

  async createLecture(
    courseId: string,
    sectionId: string,
    createLectureDto: CreateLectureDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Course> {
    const course = await this.findById(courseId, userId);

    if (
      userRole !== UserRole.ADMIN &&
      course.instructor.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You are not authorized to modify this course',
      );
    }

    const lecture = {
      _id: new Types.ObjectId(),
      ...createLectureDto,
    } as Lecture;

    await this.courseModel.findOneAndUpdate(
      {
        _id: courseId,
        'sections._id': sectionId,
      },
      {
        $push: { 'sections.$.lectures': lecture },
      },
      { new: true },
    );

    return this.findById(courseId, userId);
  }

  async checkCourseAccess(
    courseId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const course = await this.findById(courseId, userId);

    if (
      userRole !== UserRole.ADMIN &&
      course.instructor.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You are not authorized to modify this course',
      );
    }
  }

  async updateThumbnail(
    courseId: string,
    thumbnailPath: string,
  ): Promise<Course> {
    return this.courseModel
      .findByIdAndUpdate(courseId, { thumbnail: thumbnailPath }, { new: true })
      .populate('instructor', '-password -refreshToken');
  }

  async updateLectureResources(
    courseId: string,
    sectionId: string,
    lectureId: string,
    resourcePaths: string[],
    userId: string,
  ): Promise<Course> {
    await this.courseModel.findOneAndUpdate(
      {
        _id: courseId,
        'sections._id': sectionId,
        'sections.lectures._id': lectureId,
      },
      {
        $push: {
          'sections.$.lectures.$[lecture].resourceUrls': {
            $each: resourcePaths,
          },
        },
      },
      {
        arrayFilters: [{ 'lecture._id': lectureId }],
        new: true,
      },
    );

    return this.findById(courseId, userId);
  }

  async updateLectureVideo(
    courseId: string,
    sectionId: string,
    lectureId: string,
    videoPath: string,
    userId: string,
  ): Promise<Course> {
    await this.courseModel.findOneAndUpdate(
      {
        _id: courseId,
        'sections._id': sectionId,
        'sections.lectures._id': lectureId,
      },
      {
        $set: { 'sections.$.lectures.$[lecture].videoUrl': videoPath },
      },
      {
        arrayFilters: [{ 'lecture._id': lectureId }],
        new: true,
      },
    );

    return this.findById(courseId, userId);
  }

  async searchCourses(
    query: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Course>> {
    const searchRegex = new RegExp(query, 'i');
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.courseModel
        .find({
          $or: [
            { title: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            { tags: { $in: [searchRegex] } },
          ],
        })
        .populate(
          'instructor',
          '-password -refreshToken -enrolledCourses -role -__v -email -createdAt -updatedAt',
        )
        .skip(skip)
        .limit(limit),
      this.courseModel.countDocuments({
        $or: [
          { title: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { tags: { $in: [searchRegex] } },
        ],
      }),
    ]);

    const user = await this.userModel.findById(userId);

    // Check if user is enrolled in the course
    for (const course of courses) {
      if (!user.enrolledCourses.includes(course._id.toString())) {
        course.sections.forEach((section) => {
          section.lectures = [];
        });
      }
    }

    // Get temporary signed url for all resources
    for (const course of courses) {
      course.thumbnail = await this.fileUploadService.getSignedUrl(
        course.thumbnail,
      );

      for (const section of course.sections) {
        for (const lecture of section.lectures) {
          lecture.resourceUrls =
            await this.fileUploadService.getMultipleSignedUrls(
              lecture.resourceUrls,
            );

          lecture.videoUrl = await this.fileUploadService.getSignedUrl(
            lecture.videoUrl,
          );
        }
      }
    }

    return {
      items: courses,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }
}
