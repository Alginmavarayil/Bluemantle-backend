const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    youtubeId: {
      type: String,
      required: true
    },
    course: {
      type: String,
      default: "trading"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);