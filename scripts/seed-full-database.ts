import { db } from "../server/db";
import { users, centers, students, staff, attendance, reports, aiInsights } from "../shared/schema";
import { eq } from "drizzle-orm";

// First, let's clear the existing data
async function clearDatabase() {
  console.log("Clearing existing data...");
  
  // Delete in proper order to respect foreign keys
  await db.delete(attendance);
  await db.delete(reports);
  await db.delete(aiInsights);
  await db.delete(students);
  await db.delete(staff);
  await db.delete(centers);
  await db.delete(users);
  
  console.log("Database cleared successfully");
}

async function seedDatabase() {
  console.log("Seeding database with initial data...");

  // Create users with different roles according to hierarchy:
  // ghost > founder > admin > center_manager > project_intern > teaching_intern
  const usersData = [
    // Ghost (Supreme access)
    {
      username: "ghost",
      password: "supremeaccess", // In a real app, this would be hashed
      name: "Ghost Admin",
      email: "ghost@pehachan.org",
      role: "ghost",
      active: true,
    },
    // Founder level
    {
      username: "ananya",
      password: "password123", 
      name: "Ananya Patel",
      email: "ananya@pehachan.org",
      role: "founder",
      active: true,
    },
    // Admin level
    {
      username: "rajesh",
      password: "password123",
      name: "Rajesh Kumar",
      email: "rajesh@pehachan.org",
      role: "admin",
      active: true,
    },
    {
      username: "nina",
      password: "password123",
      name: "Nina Sharma",
      email: "nina@pehachan.org",
      role: "admin",
      active: true,
    },
    // Center Managers (one for each center)
    {
      username: "priya",
      password: "password123",
      name: "Priya Sharma",
      email: "priya@pehachan.org",
      role: "center_manager",
      active: true,
    },
    {
      username: "amit",
      password: "password123",
      name: "Amit Singh",
      email: "amit@pehachan.org",
      role: "center_manager",
      active: true,
    },
    {
      username: "deepa",
      password: "password123",
      name: "Deepa Verma",
      email: "deepa@pehachan.org",
      role: "center_manager",
      active: true,
    },
    {
      username: "rohan",
      password: "password123",
      name: "Rohan Joshi",
      email: "rohan@pehachan.org",
      role: "center_manager",
      active: true,
    },
    {
      username: "meera",
      password: "password123",
      name: "Meera Kapoor",
      email: "meera@pehachan.org",
      role: "center_manager",
      active: true,
    },
    // Project Interns (2 for each center)
    {
      username: "vikram",
      password: "password123",
      name: "Vikram Singh",
      email: "vikram@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "alisha",
      password: "password123",
      name: "Alisha Patel",
      email: "alisha@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "arun",
      password: "password123",
      name: "Arun Mehta",
      email: "arun@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "pooja",
      password: "password123",
      name: "Pooja Gupta",
      email: "pooja@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "rohit",
      password: "password123",
      name: "Rohit Kumar",
      email: "rohit@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "sonia",
      password: "password123",
      name: "Sonia Jain",
      email: "sonia@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "rahul",
      password: "password123",
      name: "Rahul Verma",
      email: "rahul@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "neha",
      password: "password123",
      name: "Neha Gupta",
      email: "neha@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "karan",
      password: "password123",
      name: "Karan Sharma",
      email: "karan@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "diya",
      password: "password123",
      name: "Diya Patel",
      email: "diya@pehachan.org",
      role: "project_intern",
      active: true,
    },
    // Teaching Interns (3 for each center)
    {
      username: "sandeep",
      password: "password123",
      name: "Sandeep Kumar",
      email: "sandeep@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "anita",
      password: "password123",
      name: "Anita Singh",
      email: "anita@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "ravi",
      password: "password123",
      name: "Ravi Tiwari",
      email: "ravi@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "kavita",
      password: "password123",
      name: "Kavita Chauhan",
      email: "kavita@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "prakash",
      password: "password123",
      name: "Prakash Jha",
      email: "prakash@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "sapna",
      password: "password123",
      name: "Sapna Yadav",
      email: "sapna@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "vivek",
      password: "password123",
      name: "Vivek Malhotra",
      email: "vivek@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "sneha",
      password: "password123",
      name: "Sneha Reddy",
      email: "sneha@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "aakash",
      password: "password123",
      name: "Aakash Gupta",
      email: "aakash@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "nisha",
      password: "password123",
      name: "Nisha Pandey",
      email: "nisha@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "mayank",
      password: "password123",
      name: "Mayank Singh",
      email: "mayank@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "suman",
      password: "password123",
      name: "Suman Thakur",
      email: "suman@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "krish",
      password: "password123",
      name: "Krish Shah",
      email: "krish@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "jaya",
      password: "password123",
      name: "Jaya Prasad",
      email: "jaya@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
    {
      username: "gaurav",
      password: "password123",
      name: "Gaurav Mehra",
      email: "gaurav@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
  ];

  // Insert users
  console.log("Inserting users...");
  const insertedUsers = await db.insert(users).values(usersData).returning();
  console.log(`Inserted ${insertedUsers.length} users`);

  // Get user IDs by role for later use
  const ghostUserId = insertedUsers.find(u => u.role === "ghost")!.id;
  const founderUserId = insertedUsers.find(u => u.role === "founder")!.id;
  const adminUserIds = insertedUsers.filter(u => u.role === "admin").map(u => u.id);
  const centerManagerUserIds = insertedUsers.filter(u => u.role === "center_manager").map(u => u.id);
  const projectInternUserIds = insertedUsers.filter(u => u.role === "project_intern").map(u => u.id);
  const teachingInternUserIds = insertedUsers.filter(u => u.role === "teaching_intern").map(u => u.id);

  // Create centers
  const centersData = [
    {
      name: "Laxmi Nagar Center",
      address: "45 Laxmi Nagar, East Delhi",
      city: "Delhi",
      location: { lat: 28.6311, lng: 77.2790 },
      active: true,
      totalStudents: 0,
      totalStaff: 0,
      managerId: centerManagerUserIds[0], // Assign center manager
    },
    {
      name: "Mayur Vihar Center",
      address: "Block B, Mayur Vihar Phase 2",
      city: "Delhi",
      location: { lat: 28.6008, lng: 77.2934 },
      active: true,
      totalStudents: 0,
      totalStaff: 0,
      managerId: centerManagerUserIds[1],
    },
    {
      name: "Rohini Center",
      address: "Sector 3, Rohini",
      city: "Delhi",
      location: { lat: 28.7158, lng: 77.1149 },
      active: true,
      totalStudents: 0,
      totalStaff: 0,
      managerId: centerManagerUserIds[2],
    },
    {
      name: "Dwarka Center",
      address: "Sector 12, Dwarka",
      city: "Delhi",
      location: { lat: 28.5921, lng: 77.0460 },
      active: true,
      totalStudents: 0,
      totalStaff: 0,
      managerId: centerManagerUserIds[3],
    },
    {
      name: "Shahdara Center",
      address: "Main Road, Shahdara",
      city: "Delhi",
      location: { lat: 28.6768, lng: 77.2855 },
      active: true,
      totalStudents: 0,
      totalStaff: 0,
      managerId: centerManagerUserIds[4],
    }
  ];

  // Insert centers
  console.log("Inserting centers...");
  const insertedCenters = await db.insert(centers).values(centersData).returning();
  console.log(`Inserted ${insertedCenters.length} centers`);

  // Create staff members for centers
  console.log("Inserting staff...");
  let staffMembers = [];
  
  // Assign 2 project interns and 3 teaching interns to each center
  for (let i = 0; i < insertedCenters.length; i++) {
    const centerId = insertedCenters[i].id;
    
    // Center manager
    staffMembers.push({
      userId: centerManagerUserIds[i],
      position: "center_manager",
      centerId: centerId,
      active: true,
    });
    
    // 2 Project interns per center
    staffMembers.push({
      userId: projectInternUserIds[i*2],
      position: "project_intern",
      centerId: centerId,
      active: true,
    });
    
    staffMembers.push({
      userId: projectInternUserIds[i*2+1],
      position: "project_intern",
      centerId: centerId,
      active: true,
    });
    
    // 3 Teaching interns per center
    staffMembers.push({
      userId: teachingInternUserIds[i*3],
      position: "teaching_intern",
      centerId: centerId,
      active: true,
    });
    
    staffMembers.push({
      userId: teachingInternUserIds[i*3+1],
      position: "teaching_intern",
      centerId: centerId,
      active: true,
    });
    
    staffMembers.push({
      userId: teachingInternUserIds[i*3+2],
      position: "teaching_intern",
      centerId: centerId,
      active: true,
    });
  }
  
  const insertedStaff = await db.insert(staff).values(staffMembers).returning();
  console.log(`Inserted ${insertedStaff.length} staff members`);

  // Create students 
  console.log("Inserting students...");
  const studentFirstNames = [
    ["Rohan", "Anaya", "Vivan", "Zara", "Advait", "Tia", "Rehan", "Aisha", "Dev", "Isha"],
    ["Myra", "Reyansh", "Pari", "Dhruv", "Anika", "Arjun", "Samaira", "Vihaan", "Navya", "Aarush"],
    ["Kabir", "Saanvi", "Arnav", "Avni", "Yash", "Aanya", "Aarav", "Siya", "Ved", "Ira"],
    ["Diya", "Ved", "Misha", "Aryan", "Kiara", "Ayaan", "Anvi", "Vivaan", "Ishita", "Aaryan"],
    ["Aarav", "Ira", "Shaurya", "Aadhya", "Vihaan", "Ahana", "Atharv", "Ishani", "Arush", "Anaya"]
  ];
  
  const lastNames = ["Kumar", "Sharma", "Singh", "Patel", "Gupta", "Verma", "Joshi", "Mehta", "Das", "Choudhury", "Kapoor", "Malhotra", "Bose", "Banerjee", "Reddy"];
  const grades = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  const subjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Art", "Computer Science"];
  
  let studentsData = [];
  let attendanceData = [];
  
  // Create 10 students for each center
  for (let i = 0; i < insertedCenters.length; i++) {
    const centerId = insertedCenters[i].id;
    
    for (let j = 0; j < 10; j++) {
      const age = 5 + Math.floor(Math.random() * 10);
      const grade = grades[Math.floor(Math.random() * grades.length)];
      const studentIdPrefix = "STU-" + new Date().getFullYear() + "-";
      const studentId = studentIdPrefix + String(i * 10 + j + 1).padStart(4, '0');
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      
      studentsData.push({
        studentId: studentId,
        name: `${studentFirstNames[i][j]} ${lastName}`,
        age: age,
        grade: grade,
        guardianName: `Parent of ${studentFirstNames[i][j]}`,
        contactNumber: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
        address: `${Math.floor(Math.random() * 100) + 1}, ${centersData[i].address}`,
        enrollmentDate: new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
        centerId: centerId,
        gender: gender,
        active: true,
      });
    }
  }
  
  const insertedStudents = await db.insert(students).values(studentsData).returning();
  console.log(`Inserted ${insertedStudents.length} students`);

  // Create attendance records for the past 30 days
  console.log("Inserting attendance records...");
  for (const student of insertedStudents) {
    const today = new Date();
    
    for (let day = 0; day < 30; day++) {
      const recordDate = new Date();
      recordDate.setDate(today.getDate() - day);
      
      // Students have about 85% attendance rate
      const present = Math.random() > 0.15;
      
      // Mark attendance by a random teaching intern or project intern from the same center
      const centerStaff = insertedStaff.filter(s => s.centerId === student.centerId);
      const markedByStaffMember = centerStaff[Math.floor(Math.random() * centerStaff.length)];
      
      attendanceData.push({
        studentId: student.id,
        date: recordDate,
        centerId: student.centerId,
        present: present,
        markedBy: markedByStaffMember.userId,
      });
    }
  }
  
  const insertedAttendance = await db.insert(attendance).values(attendanceData).returning();
  console.log(`Inserted ${insertedAttendance.length} attendance records`);

  // Create AI insights for each center
  console.log("Inserting AI insights...");
  const insightTitles = [
    "Performance Insight",
    "Attendance Alert",
    "Resource Optimization",
    "Teaching Effectiveness",
    "Student Engagement"
  ];
  
  const insightCategories = ["performance", "attendance", "resource", "teaching", "engagement"];
  const insightDescriptions = [
    "Students in %SUBJECT% class have shown a %PERCENT%% improvement after implementing the new interactive teaching method.",
    "%COUNT% students have missed more than 3 classes this week. Consider scheduling follow-ups with their parents.",
    "%RESOURCE% utilization is at %PERCENT%% capacity. Consider adding more %ACTIVITY% to maximize resource usage.",
    "Teacher %NAME% has achieved %PERCENT%% higher engagement rates using the new visual learning techniques.",
    "Student participation increased by %PERCENT%% during the recent %ACTIVITY% activities."
  ];

  let insightsData = [];
  
  for (const center of insertedCenters) {
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * insightTitles.length);
      let description = insightDescriptions[idx];
      
      // Replace placeholders with random values
      description = description
        .replace('%SUBJECT%', subjects[Math.floor(Math.random() * subjects.length)])
        .replace('%PERCENT%', (Math.floor(Math.random() * 30) + 10).toString())
        .replace('%COUNT%', (Math.floor(Math.random() * 8) + 3).toString())
        .replace('%RESOURCE%', ['Computer Lab', 'Library', 'Science Lab', 'Art Room'][Math.floor(Math.random() * 4)])
        .replace('%ACTIVITY%', ['programming classes', 'reading sessions', 'group activities', 'workshops'][Math.floor(Math.random() * 4)])
        .replace('%NAME%', insertedUsers[Math.floor(Math.random() * insertedUsers.length)].name);
      
      insightsData.push({
        title: insightTitles[idx],
        description: description,
        category: insightCategories[idx],
        centerId: center.id,
        data: { 
          improvementPercentage: Math.floor(Math.random() * 30) + 10, 
          subject: subjects[Math.floor(Math.random() * subjects.length)], 
          period: ["30 days", "this week", "this month", "this quarter"][Math.floor(Math.random() * 4)] 
        }
      });
    }
  }
  
  const insertedInsights = await db.insert(aiInsights).values(insightsData).returning();
  console.log(`Inserted ${insertedInsights.length} AI insights`);

  // Generate some reports
  console.log("Inserting reports...");
  const reportTypes = ["monthly", "quarterly", "annual", "performance", "attendance"];
  const reportTitles = [
    "Monthly Performance Report - %MONTH% %YEAR%",
    "Quarterly Overview - Q%QUARTER% %YEAR%",
    "Annual Center Report - %YEAR%",
    "Student Performance Analysis - %MONTH% %YEAR%",
    "Attendance Summary - %MONTH% %YEAR%"
  ];
  
  let reportsData = [];
  const months = ["January", "February", "March", "April", "May", "June"];
  const quarters = [1, 2];
  const currentYear = new Date().getFullYear();
  
  for (const center of insertedCenters) {
    for (let i = 0; i < 5; i++) {
      const type = reportTypes[i];
      let title = reportTitles[i];
      const month = months[Math.floor(Math.random() * months.length)];
      const quarter = quarters[Math.floor(Math.random() * quarters.length)];
      
      title = title
        .replace('%MONTH%', month)
        .replace('%YEAR%', currentYear.toString())
        .replace('%QUARTER%', quarter.toString());
      
      // Generate report by center manager
      const centerManager = insertedStaff.find(s => s.centerId === center.id && s.position === "center_manager");
      
      reportsData.push({
        type: type,
        title: title,
        content: {
          summary: `This is a ${type} report for ${center.name} for ${month} ${currentYear}`,
          metrics: {
            studentAttendance: Math.floor(Math.random() * 20) + 80,
            academicProgress: Math.floor(Math.random() * 30) + 70,
            teacherPerformance: Math.floor(Math.random() * 15) + 85
          },
          recommendations: [
            "Continue with the current teaching methodology",
            "Follow up with absent students",
            "Implement more interactive learning sessions"
          ]
        },
        centerId: center.id,
        generatedBy: centerManager!.userId
      });
    }
  }
  
  const insertedReports = await db.insert(reports).values(reportsData).returning();
  console.log(`Inserted ${insertedReports.length} reports`);

  // Update center total counts
  console.log("Updating center statistics...");
  for (const center of insertedCenters) {
    const centerStudents = insertedStudents.filter(s => s.centerId === center.id);
    const centerStaffMembers = insertedStaff.filter(s => s.centerId === center.id);
    
    await db.update(centers)
      .set({
        totalStudents: centerStudents.length,
        totalStaff: centerStaffMembers.length
      })
      .where(eq(centers.id, center.id));
  }

  console.log("Database seeding completed successfully!");
}

// Execute the seeding function
clearDatabase()
  .then(() => seedDatabase())
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });