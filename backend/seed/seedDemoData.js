const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Complaint = require("../models/Complaint");
const Event = require("../models/Event");
const Announcement = require("../models/Announcement");

const required = [
  "ADMIN_EMAIL",
  "ADMIN_NAME",
  "ADMIN_PASSWORD",
  "DEMO_STUDENT_EMAIL",
  "DEMO_STUDENT_PASSWORD",
];

const seedDemoData = async () => {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Set these backend environment variables before demo seeding: ${missing.join(", ")}`);
  }
  if (process.env.ADMIN_PASSWORD.length < 12 || process.env.DEMO_STUDENT_PASSWORD.length < 12) {
    throw new Error("Admin and demo-student passwords must be at least 12 characters.");
  }
  if (!process.env.DEMO_STUDENT_EMAIL.toLowerCase().endsWith("@demo.smart-campus.invalid")) {
    throw new Error("DEMO_STUDENT_EMAIL must use the reserved @demo.smart-campus.invalid domain.");
  }

  await connectDB();
  const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const studentEmail = process.env.DEMO_STUDENT_EMAIL.trim().toLowerCase();
  let admin = await User.findOne({ email: adminEmail }).select("role");
  if (admin && admin.role !== "admin") {
    throw new Error("ADMIN_EMAIL belongs to a non-admin account; demo data was not changed.");
  }
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME,
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
      isDemo: true,
    });
  }

  let demoUser = await User.findOne({ email: studentEmail }).select("role");
  if (demoUser && demoUser.role !== "student") {
    throw new Error("DEMO_STUDENT_EMAIL belongs to a non-student account; demo data was not changed.");
  }
  if (!demoUser) {
    demoUser = await User.create({
      name: "Jordan Demo Student",
      email: studentEmail,
      password: process.env.DEMO_STUDENT_PASSWORD,
      role: "student",
      isDemo: true,
    });
  }

  const student = await Student.findOneAndUpdate(
    { email: studentEmail },
    {
      $setOnInsert: {
        rollNumber: "DEMO-2026001",
        fullName: demoUser.name,
        email: studentEmail,
        department: "Computer Science",
        course: "B.Tech",
        semester: 4,
        phoneNumber: "000-000-0000",
        status: "Active",
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  const courseDefinitions = [
    {
      courseCode: "DEMO-CS301",
      courseName: "Demo Database Systems",
      department: "Computer Science",
      credits: 3,
      instructor: "Demo Faculty",
      semester: 4,
      description: "Optional demo course; not a production enrollment.",
    },
    {
      courseCode: "DEMO-CS302",
      courseName: "Demo Web Engineering",
      department: "Computer Science",
      credits: 3,
      instructor: "Demo Faculty",
      semester: 4,
      description: "Optional demo course; not a production enrollment.",
    },
  ];
  const courses = [];
  for (const definition of courseDefinitions) {
    const course = await Course.findOneAndUpdate(
      { courseCode: definition.courseCode },
      {
        $setOnInsert: { ...definition, isDemo: true },
        $addToSet: { enrolledStudents: student._id },
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    );
    courses.push(course);
  }

  const demoAttendance = [
    { date: new Date("2024-04-15T00:00:00.000Z"), status: "Present" },
    { date: new Date("2024-04-16T00:00:00.000Z"), status: "Late" },
    { date: new Date("2024-04-17T00:00:00.000Z"), status: "Present" },
  ];
  for (const record of demoAttendance) {
    await Attendance.findOneAndUpdate(
      { student: student._id, course: courses[0]._id, date: record.date },
      {
        $setOnInsert: {
          ...record,
          student: student._id,
          course: courses[0]._id,
          markedBy: admin._id,
          remarks: "",
          isDemo: true,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    );
  }

  await Complaint.findOneAndUpdate(
    { title: "[DEMO] Library study-room WiFi", submittedBy: demoUser._id },
    {
      $setOnInsert: {
        title: "[DEMO] Library study-room WiFi",
        description: "Demo request to improve WiFi coverage in the library study area.",
        category: "Infrastructure",
        priority: "Medium",
        status: "Pending",
        submittedBy: demoUser._id,
        studentName: demoUser.name,
        studentEmail: studentEmail,
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  await Event.findOneAndUpdate(
    { title: "[DEMO] Campus technology showcase", createdBy: admin._id },
    {
      $setOnInsert: {
        title: "[DEMO] Campus technology showcase",
        description: "Optional demo event for testing student event visibility.",
        category: "Technical",
        venue: "Demo Innovation Hall",
        date: new Date(Date.now() + 7 * 86400000),
        time: "10:00 AM - 12:00 PM",
        capacity: 100,
        registeredStudents: [],
        createdBy: admin._id,
        status: "Upcoming",
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  await Announcement.findOneAndUpdate(
    { title: "[DEMO] Welcome to the student portal", createdBy: admin._id },
    {
      $setOnInsert: {
        title: "[DEMO] Welcome to the student portal",
        content: "This clearly marked demo notice is included for portal presentation testing.",
        category: "General",
        priority: "Normal",
        targetAudience: "Students",
        postedBy: "Demo Administration",
        createdBy: admin._id,
        isActive: true,
        isDemo: true,
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  console.log("Optional demo records are ready. They are marked isDemo=true; no existing records were deleted.");
};

seedDemoData()
  .catch((error) => {
    console.error("Demo seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
