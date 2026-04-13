const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.createTeacher = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate inputs
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create teacher
        const newTeacher = new User({
            name,
            email,
            password: hashedPassword,
            role: "teacher"
        });

        await newTeacher.save();

        // Convert to object and exclude password
        const teacherData = newTeacher.toObject();
        delete teacherData.password;

        res.status(201).json({
            success: true,
            message: "Teacher created successfully",
            data: teacherData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTeachers = async (req, res) => {
    try {
        // Fetch all teachers, only return specified fields
        const teachers = await User.find({ role: "teacher" }).select("name email createdAt");

        res.json({
            success: true,
            message: "Teachers fetched successfully",
            data: teachers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
