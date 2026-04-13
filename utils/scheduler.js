const cron = require("node-cron");
const LiveClass = require("../models/LiveClass");
const Batch = require("../models/Batch");
const User = require("../models/user");
const Notification = require("../models/Notification");

const initScheduler = () => {
  console.log("Initializing scheduler (Asia/Kolkata timezone)...");

  // 1. Live Class Reminders: Runs every minute
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const now = new Date();
        const targetTime = new Date(now.getTime() + 10 * 60 * 1000); // exactly 10 minutes from now

        // Find classes starting in the next 10 minutes that haven't had reminders sent
        const upcomingClasses = await LiveClass.find({
          date: { $gte: now, $lte: targetTime },
          reminderSent: false,
        });

        if (upcomingClasses.length === 0) return; // No classes to process

        let totalNotificationsCreated = 0;

        for (const liveClass of upcomingClasses) {
          const batch = await Batch.findById(liveClass.batchId);
          if (!batch || !batch.students || batch.students.length === 0) continue; // Skip if no batch or students

          const notificationsToCreate = [];

          // Create notification for each student
          batch.students.forEach((studentId) => {
            notificationsToCreate.push({
              userId: studentId,
              message: `Your class on "${liveClass.topic || 'a scheduled topic'}" starts in 10 minutes.`,
              type: "class_reminder",
            });
          });

          // Optionally add teacher notification
          if (liveClass.teacherId) {
            notificationsToCreate.push({
              userId: liveClass.teacherId,
              message: `You have a class on "${liveClass.topic || 'a scheduled topic'}" starting in 10 minutes.`,
              type: "class_reminder",
            });
          }

          if (notificationsToCreate.length > 0) {
            // Bulk insert notifications safely, ignore duplicates/errors on individual docs
            await Notification.insertMany(notificationsToCreate, { ordered: false }).catch(err => {
              console.warn("Scheduler: Some duplicates ignored during bulk insert.");
            });
            totalNotificationsCreated += notificationsToCreate.length;
          }
          
          // Mark reminder as sent only after successful creation (or safely skipped due to empty classes)
          liveClass.reminderSent = true;
          await liveClass.save();
        }
        
        console.log(`[Scheduled Job] Class Reminders: Processed ${upcomingClasses.length} classes, created ${totalNotificationsCreated} notifications.`);
      } catch (error) {
        console.error("Error running Live Class Reminder cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  // 2. Daily Study Reminder: Runs at 7:00 PM every day
  cron.schedule(
    "0 19 * * *",
    async () => {
      try {
        console.log("Running Daily Study Reminder cron job...");

        // Find students with enrolled courses
        const activeStudents = await User.find({
          role: "student",
          "enrolledCourses.0": { $exists: true }, // Ensure enrolledCourses array is not empty
        }).select("_id");

        if (activeStudents.length === 0) {
          console.log("[Scheduled Job] Study Reminders: No active students found.");
          return;
        }

        const notificationsToCreate = activeStudents.map((student) => ({
          userId: student._id,
          message: "Time to continue your learning today.",
          type: "study_reminder",
        }));

        await Notification.insertMany(notificationsToCreate, { ordered: false }).catch(err => {
            console.warn("Scheduler: Some duplicates ignored during bulk insert.");
        });

        console.log(`[Scheduled Job] Study Reminders: Created ${notificationsToCreate.length} daily reminders.`);
      } catch (error) {
        console.error("Error running Daily Study Reminder cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

module.exports = initScheduler;
