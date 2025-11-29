import mongoose, { Schema, Document } from "mongoose";

export interface IRecording extends Document {
  userId: string;
  email: string;
  name: string;
  audioUrl: string;
  date: Date;
}

const RecordingSchema = new Schema<IRecording>({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  audioUrl: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.models.Recording ||
  mongoose.model<IRecording>("Recording", RecordingSchema);
