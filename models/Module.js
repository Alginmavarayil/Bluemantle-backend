const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

// Compound index for efficient sorting per course
moduleSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model("Module", moduleSchema);
