import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { CourseCategory } from '../enums/course-category.enum';
import { CourseDifficulty } from '../enums/course-difficulty.enum';
import { Section, SectionSchema } from './section.schema';

@Schema({ timestamps: true })
export class Course extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  instructor: User;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: [SectionSchema], default: [] })
  sections: Section[];

  @Prop()
  thumbnail: string;

  @Prop({ required: true, enum: CourseCategory })
  category: CourseCategory;

  @Prop({ required: true, enum: CourseDifficulty })
  difficulty: CourseDifficulty;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
