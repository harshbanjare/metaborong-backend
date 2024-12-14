import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Lecture extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  videoUrl?: string;

  @Prop({ type: [String], default: [] })
  resourceUrls: string[];

  @Prop({ required: true, min: 0 })
  duration: number;
}

export const LectureSchema = SchemaFactory.createForClass(Lecture);
