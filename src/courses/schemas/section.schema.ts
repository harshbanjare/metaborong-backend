import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Lecture, LectureSchema } from './lecture.schema';

@Schema()
export class Section extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [LectureSchema], default: [] })
  lectures: Lecture[];

  @Prop({ required: true })
  order: number;
}

export const SectionSchema = SchemaFactory.createForClass(Section);
