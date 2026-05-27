import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorName: { type: String, default: "" },
    type: { type: String, required: true, index: true },
    targetType: { type: String, default: "" }, // "task" | "project" | "user"
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetName: { type: String, default: "" },
    message: { type: String, required: true },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);
