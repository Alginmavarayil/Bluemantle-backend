const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    zoomLink: {
      type: String,
      required: true
    },
    topic: {
      type: String
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    duration: {
      type: Number
    },
    reminderSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveClass", liveClassSchema);
