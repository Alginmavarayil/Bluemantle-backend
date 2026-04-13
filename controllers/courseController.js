const Course = require("../models/Course");
const Module = require("../models/Module");
const Video = require("../models/video");
const Note = require("../models/Note");

exports.createCourse = async (req, res) => {
    try {
        const { title, description, price, isPaid, duration } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const course = await Course.create({
            title,
            description,
            price,
            isPaid,
            duration,
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, message: "Course created successfully", data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find({ isActive: true });
        res.json({ success: true, message: "Courses retrieved successfully", data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const course = await Course.findOne({ _id: id, isActive: true }).lean();
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        const modules = await Module.find({ courseId: id }).sort({ order: 1 }).lean();
        const videos = await Video.find({ courseId: id }).sort({ order: 1 }).lean();
        const notes = await Note.find({ courseId: id }).lean();

        const formattedModules = modules.map(mod => {
            return {
                ...mod,
                videos: videos.filter(v => v.moduleId.toString() === mod._id.toString()),
                notes: notes.filter(n => n.moduleId.toString() === mod._id.toString())
            };
        });

        res.json({
            success: true,
            message: "Course details retrieved successfully",
            data: {
                course,
                modules: formattedModules
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseVideos = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findOne({ _id: id, isActive: true });
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const videos = await Video.find({ courseId: id }).sort({ moduleId: 1, order: 1 });
        res.json({ success: true, message: "Videos retrieved successfully", data: videos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findOne({ _id: id, isActive: true });
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const notes = await Note.find({ courseId: id });
        res.json({ success: true, message: "Notes retrieved successfully", data: notes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const { title, description, price, duration, isPaid } = req.body;

        if (title !== undefined) course.title = title;
        if (description !== undefined) course.description = description;
        if (duration !== undefined) course.duration = duration;
        
        // Only take isPaid from request if we don't have price logic overriding it
        if (isPaid !== undefined) course.isPaid = isPaid;

        if (price !== undefined) {
            if (typeof price !== 'number' || price < 0) {
                return res.status(400).json({ success: false, message: "Price must be a positive number" });
            }
            course.price = price;
            if (price > 0) course.isPaid = true;
            if (price === 0) course.isPaid = false;
        }

        await course.save();
        res.json({ success: true, message: "Course updated successfully", data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });
        if (!course.isActive) return res.status(400).json({ success: false, message: "Course is already inactive" });

        course.isActive = false;
        await course.save();

        res.json({ success: true, message: "Course deleted successfully", data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });
        if (course.isActive) return res.status(400).json({ success: false, message: "Course is already active" });

        course.isActive = true;
        await course.save();

        res.json({ success: true, message: "Course restored successfully", data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
