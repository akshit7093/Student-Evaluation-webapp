import { db } from "../server/db";
import { users, centers, students, staff, attendance, reports, aiInsights } from "../shared/schema";

async function seedDatabase() {
  console.log("Seeding database with initial data...");

  // Create users with different roles
  const usersData = [
    {
      username: "ghost",
      password: "supremeaccess", // In a real app, this would be hashed
      name: "Ghost Admin",
      email: "ghost@pehachan.org",
      role: "ghost",
      active: true,
    },
    {
      username: "ananya",
      password: "password123", // In a real app, this would be hashed
      name: "Ananya Patel",
      email: "ananya@pehachan.org",
      role: "founder",
      active: true,
    },
    {
      username: "rajesh",
      password: "password123",
      name: "Rajesh Kumar",
      email: "rajesh@pehachan.org",
      role: "admin",
      active: true,
    },
    {
      username: "priya",
      password: "password123",
      name: "Priya Sharma",
      email: "priya@pehachan.org",
      role: "center_manager",
      active: true,
    },
    {
      username: "vikram",
      password: "password123",
      name: "Vikram Singh",
      email: "vikram@pehachan.org",
      role: "project_intern",
      active: true,
    },
    {
      username: "neha",
      password: "password123",
      name: "Neha Gupta",
      email: "neha@pehachan.org",
      role: "teaching_intern",
      active: true,
    },
  ];

  // Insert users
  console.log("Inserting users...");
  const insertedUsers = await db.insert(users).values(usersData).returning();
  console.log(`Inserted ${insertedUsers.length} users`);

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
    },
    {
      name: "Mayur Vihar Center",
      address: "Block B, Mayur Vihar Phase 2",
      city: "Delhi",
      location: { lat: 28.6008, lng: 77.2934 },
      active: true,
      totalStudents: 0,
      totalStaff: 0,
    },
    {
      name: "Rohini Center",
      address: "Sector 3, Rohini",
      city: "Delhi",
      location: { lat: 28.7158, lng: 77.1149 },
      active: true,
      totalStudents: 0,
      totalStaff: 0,
    },
    {
      name: "Dwarka Center",
      address: "Sector 12, Dwarka",
      city: "Delhi",
      location: { lat: 28.5921, lng: 77.0460 },
      active: true,
      totalStudents: 0,
      totalStaff: 0,
    },
    {
      name: "Shahdara Center",
      address: "Main Road, Shahdara",
      city: "Delhi",
      location: { lat: 28.6768, lng: 77.2855 },
      active: true,
      totalStudents: 0,
      totalStaff: 0,
    }
  ];

  // Insert centers
  console.log("Inserting centers...");
  const insertedCenters = await db.insert(centers).values(centersData).returning();
  console.log(`Inserted ${insertedCenters.length} centers`);

  // Staff data
  const staffRoles = ["center_manager", "teacher", "teacher", "project_intern", "teaching_intern"];
  const staffFirstNames = [
    ["Arjun", "Divya", "Rahul", "Sanya", "Karan"],
    ["Meera", "Alok", "Tanvi", "Rohit", "Kavita"],
    ["Sanjay", "Aisha", "Vijay", "Neeta", "Prakash"],
    ["Ishaan", "Leela", "Manoj", "Ritu", "Deepak"],
    ["Sunita", "Amit", "Riya", "Vivek", "Anjali"]
  ];
  const staffLastNames = ["Kumar", "Sharma", "Singh", "Patel", "Gupta", "Verma", "Joshi", "Mehta", "Das", "Choudhury"];

  // Create additional users for staff members
  console.log("Inserting additional users for staff...");
  let staffUsers = [];
  
  for (let i = 0; i < insertedCenters.length; i++) {
    for (let j = 0; j < 5; j++) {
      const firstName = staffFirstNames[i][j];
      const lastName = staffLastNames[Math.floor(Math.random() * staffLastNames.length)];
      const username = firstName.toLowerCase();
      
      staffUsers.push({
        username: username,
        password: "password123",
        name: `${firstName} ${lastName}`,
        email: `${username}@pehachan.org`,
        role: staffRoles[j],
        active: true,
      });
    }
  }
  
  const insertedStaffUsers = await db.insert(users).values(staffUsers).returning();
  console.log(`Inserted ${insertedStaffUsers.length} staff users`);
  
  // Create staff for each center
  console.log("Inserting staff...");
  let staffMembers = [];
  
  for (let i = 0; i < insertedCenters.length; i++) {
    const centerId = insertedCenters[i].id;
    
    for (let j = 0; j < 5; j++) {
      // The corresponding user ID will be in insertedStaffUsers
      const userIndex = i * 5 + j;
      const userId = insertedStaffUsers[userIndex].id;
      
      staffMembers.push({
        userId: userId,
        position: staffRoles[j],
        centerId: centerId,
        active: true,
      });
    }
  }
  
  const insertedStaff = await db.insert(staff).values(staffMembers).returning();
  console.log(`Inserted ${insertedStaff.length} staff members`);

  // Create students
  console.log("Inserting students...");
  const studentFirstNames = [
    ["Rohan", "Anaya", "Vivan", "Zara", "Advait"],
    ["Myra", "Reyansh", "Pari", "Dhruv", "Anika"],
    ["Kabir", "Saanvi", "Arnav", "Avni", "Yash"],
    ["Diya", "Ved", "Misha", "Aryan", "Kiara"],
    ["Aarav", "Ira", "Shaurya", "Aadhya", "Vihaan"]
  ];
  const grades = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  const subjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies"];
  
  let studentsData = [];
  let attendanceData = [];
  
  for (let i = 0; i < insertedCenters.length; i++) {
    const centerId = insertedCenters[i].id;
    
    for (let j = 0; j < 5; j++) {
      const age = 5 + Math.floor(Math.random() * 10);
      const grade = grades[Math.floor(Math.random() * grades.length)];
      const studentIdPrefix = "STU-" + new Date().getFullYear() + "-";
      const studentId = studentIdPrefix + String(i * 5 + j + 1).padStart(4, '0');
      
      studentsData.push({
        studentId: studentId,
        name: `${studentFirstNames[i][j]} ${staffLastNames[Math.floor(Math.random() * staffLastNames.length)]}`,
        age: age,
        grade: grade,
        guardianName: `Parent of ${studentFirstNames[i][j]}`,
        contactNumber: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
        address: `${Math.floor(Math.random() * 100) + 1}, ${centersData[i].address}`,
        enrollmentDate: new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
        centerId: centerId,
        gender: Math.random() > 0.5 ? 'male' : 'female',
        active: true,
      });
    }
  }
  
  const insertedStudents = await db.insert(students).values(studentsData).returning();
  console.log(`Inserted ${insertedStudents.length} students`);

  // Create attendance records
  console.log("Inserting attendance records...");
  for (const student of insertedStudents) {
    const today = new Date();
    
    for (let day = 0; day < 10; day++) {
      const recordDate = new Date();
      recordDate.setDate(today.getDate() - day);
      
      // Students have about 85% attendance rate
      const present = Math.random() > 0.15;
      
      attendanceData.push({
        studentId: student.id,
        date: recordDate,
        centerId: student.centerId,
        present: present,
        markedBy: null, // In a real app, this would be marked by a staff member
      });
    }
  }
  
  const insertedAttendance = await db.insert(attendance).values(attendanceData).returning();
  console.log(`Inserted ${insertedAttendance.length} attendance records`);

  // Create AI insights
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
        .replace('%NAME%', staffFirstNames[Math.floor(Math.random() * staffFirstNames.length)][Math.floor(Math.random() * 5)]);
      
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

  console.log("Database seeding completed successfully!");
}

// Execute the seeding function
seedDatabase()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });