const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["class_reminder", "study_reminder"],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    }
  },
  { timestamps: true }
);

// Compound index for querying user's unread notifications
notificationSchema.index({ userId: 1, isRead: 1 });

// TTL index to automatically remove old notifications
// It will be removed when `expiresAt` hits the current exact time
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
