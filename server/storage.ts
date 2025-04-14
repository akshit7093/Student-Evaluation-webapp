import {
  users, centers, students, staff as staffTable, attendance, reports, aiInsights,
  type User, type InsertUser,
  type Center, type InsertCenter,
  type Student, type InsertStudent,
  type Staff, type InsertStaff,
  type Attendance, type InsertAttendance,
  type Report, type InsertReport,
  type AiInsight, type InsertAiInsight
} from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;

  // Center operations
  getCenter(id: number): Promise<Center | undefined>;
  createCenter(center: InsertCenter): Promise<Center>;
  updateCenter(id: number, center: Partial<Center>): Promise<Center | undefined>;
  deleteCenter(id: number): Promise<boolean>;
  listCenters(): Promise<Center[]>;

  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentsByCenter(centerId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  listStudents(): Promise<Student[]>;

  // Staff operations
  getStaff(id: number): Promise<Staff | undefined>;
  getStaffByCenter(centerId: number): Promise<Staff[]>;
  createStaff(staffMember: InsertStaff): Promise<Staff>;
  updateStaff(id: number, staffMember: Partial<Staff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<boolean>;
  listStaff(): Promise<Staff[]>;

  // Attendance operations
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByCenter(centerId: number, date?: Date): Promise<Attendance[]>;
  createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendanceRecord: Partial<Attendance>): Promise<Attendance | undefined>;
  listAttendance(): Promise<Attendance[]>;

  // Report operations
  getReport(id: number): Promise<Report | undefined>;
  getReportsByCenter(centerId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  deleteReport(id: number): Promise<boolean>;
  listReports(): Promise<Report[]>;

  // AI Insight operations
  getAiInsight(id: number): Promise<AiInsight | undefined>;
  getAiInsightsByCenter(centerId: number): Promise<AiInsight[]>;
  createAiInsight(insight: InsertAiInsight): Promise<AiInsight>;
  deleteAiInsight(id: number): Promise<boolean>;
  listAiInsights(): Promise<AiInsight[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private centers: Map<number, Center>;
  private students: Map<number, Student>;
  private staff: Map<number, Staff>;
  private attendance: Map<number, Attendance>;
  private reports: Map<number, Report>;
  private aiInsights: Map<number, AiInsight>;
  
  private userIdCounter: number;
  private centerIdCounter: number;
  private studentIdCounter: number;
  private staffIdCounter: number;
  private attendanceIdCounter: number;
  private reportIdCounter: number;
  private aiInsightIdCounter: number;

  constructor() {
    this.users = new Map();
    this.centers = new Map();
    this.students = new Map();
    this.staff = new Map();
    this.attendance = new Map();
    this.reports = new Map();
    this.aiInsights = new Map();
    
    this.userIdCounter = 1;
    this.centerIdCounter = 1;
    this.studentIdCounter = 1;
    this.staffIdCounter = 1;
    this.attendanceIdCounter = 1;
    this.reportIdCounter = 1;
    this.aiInsightIdCounter = 1;

    // Initialize with some default data
    this.initializeData();
  }

  private initializeData() {
    // Create users with different roles
    const users = [
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

    users.forEach(user => this.createUser(user));

    // Create some centers
    const centers = [
      {
        name: "Laxmi Nagar Center",
        address: "45 Laxmi Nagar, East Delhi",
        city: "Delhi",
        location: { lat: 28.6311, lng: 77.2790 },
        active: true,
      },
      {
        name: "Mayur Vihar Center",
        address: "Block B, Mayur Vihar Phase 2",
        city: "Delhi",
        location: { lat: 28.6008, lng: 77.2934 },
        active: true,
      },
      {
        name: "Rohini Center",
        address: "Sector 3, Rohini",
        city: "Delhi",
        location: { lat: 28.7158, lng: 77.1149 },
        active: true,
      },
      {
        name: "Dwarka Center",
        address: "Sector 12, Dwarka",
        city: "Delhi",
        location: { lat: 28.5921, lng: 77.0460 },
        active: true,
      },
      {
        name: "Shahdara Center",
        address: "Main Road, Shahdara",
        city: "Delhi",
        location: { lat: 28.6768, lng: 77.2855 },
        active: true,
      }
    ];

    // Create centers first and store their IDs
    const centerIds = centers.map(center => {
      const createdCenter = this.createCenter(center);
      return createdCenter.id;
    });

    // Create 5 staff members for each center
    const staffRoles = ["center_manager", "teacher", "teacher", "project_intern", "teaching_intern"];
    const staffFirstNames = [
      ["Arjun", "Divya", "Rahul", "Sanya", "Karan"],
      ["Meera", "Alok", "Tanvi", "Rohit", "Kavita"],
      ["Sanjay", "Aisha", "Vijay", "Neeta", "Prakash"],
      ["Ishaan", "Leela", "Manoj", "Ritu", "Deepak"],
      ["Sunita", "Amit", "Riya", "Vivek", "Anjali"]
    ];
    const staffLastNames = ["Kumar", "Sharma", "Singh", "Patel", "Gupta", "Verma", "Joshi", "Mehta", "Das", "Choudhury"];

    centerIds.forEach((centerId, centerIndex) => {
      for (let i = 0; i < 5; i++) {
        const staffMember = {
          userId: this.userIdCounter++, // Or any method you have to assign a userId
          name: `${staffFirstNames[centerIndex][i]} ${staffLastNames[Math.floor(Math.random() * staffLastNames.length)]}`,
          position: staffRoles[i],
          email: `${staffFirstNames[centerIndex][i].toLowerCase()}@pehachan.org`,
          phone: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
          centerId: centerId,
          active: true,
        };

        this.createStaff(staffMember);
      }
    });

    // Create 5 students for each center
    const studentFirstNames = [
      ["Rohan", "Anaya", "Vivan", "Zara", "Advait"],
      ["Myra", "Reyansh", "Pari", "Dhruv", "Anika"],
      ["Kabir", "Saanvi", "Arnav", "Avni", "Yash"],
      ["Diya", "Ved", "Misha", "Aryan", "Kiara"],
      ["Aarav", "Ira", "Shaurya", "Aadhya", "Vihaan"]
    ];

    const grades = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
    const subjects = ["Mathematics", "Science", "English", "Hindi", "Social Studies"];

    centerIds.forEach((centerId, centerIndex) => {
      for (let i = 0; i < 5; i++) {
        const age = 5 + Math.floor(Math.random() * 10);
        const grade = grades[Math.floor(Math.random() * grades.length)];
        const preferredSubject = subjects[Math.floor(Math.random() * subjects.length)];
        
        const student = {
          name: `${studentFirstNames[centerIndex][i]} ${staffLastNames[Math.floor(Math.random() * staffLastNames.length)]}`,
          age: age,
          grade: grade,
          guardianName: `Parent of ${studentFirstNames[centerIndex][i]}`,
          guardianContact: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
          address: `${Math.floor(Math.random() * 100) + 1}, ${centers[centerIndex].address}`,
          enrollmentDate: new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
          centerId: centerId,
          academicPerformance: Math.floor(Math.random() * 5) + 1,
          attendancePercentage: Math.floor(Math.random() * 40) + 60,
          preferredSubject: preferredSubject,
          active: true,
          notes: `${studentFirstNames[centerIndex][i]} is a ${age} year old student in grade ${grade} with an interest in ${preferredSubject}.`,
          gender: 'male' // or 'female', 'other' as appropriate
        };

        // const createdStudent = this.createStudent(student);
        
        const createdStudent = this.createStudent(student);
        
        // Add attendance records for each student
        const today = new Date();
        for (let day = 0; day < 10; day++) {
          const recordDate = new Date();
          recordDate.setDate(today.getDate() - day);
          
          // Students have about 85% attendance rate
          const isPresent = Math.random() > 0.15;
          
          const attendance = {
            studentId: createdStudent.id,
            date: recordDate,
            status: isPresent ? "present" : "absent",
            notes: isPresent ? "" : "Student was absent",
            centerId: centerId
          };
          
          this.createAttendance(attendance);
        }
      }
    });

    // Create AI insights for each center
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

    centerIds.forEach(centerId => {
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
        
        const insight = {
          title: insightTitles[idx],
          description: description,
          category: insightCategories[idx],
          centerId: centerId,
          data: { 
            improvementPercentage: Math.floor(Math.random() * 30) + 10, 
            subject: subjects[Math.floor(Math.random() * subjects.length)], 
            period: ["30 days", "this week", "this month", "this quarter"][Math.floor(Math.random() * 4)] 
          }
        };
        
        this.createAiInsight(insight);
      }
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Center operations
  async getCenter(id: number): Promise<Center | undefined> {
    return this.centers.get(id);
  }

  async createCenter(insertCenter: InsertCenter): Promise<Center> {
    const id = this.centerIdCounter++;
    const now = new Date();
    const center: Center = { 
      ...insertCenter, 
      id, 
      totalStudents: 0,
      totalStaff: 0,
      createdAt: now
    };
    this.centers.set(id, center);
    return center;
  }

  async updateCenter(id: number, centerData: Partial<Center>): Promise<Center | undefined> {
    const center = await this.getCenter(id);
    if (!center) return undefined;

    const updatedCenter = { ...center, ...centerData };
    this.centers.set(id, updatedCenter);
    return updatedCenter;
  }

  async deleteCenter(id: number): Promise<boolean> {
    return this.centers.delete(id);
  }

  async listCenters(): Promise<Center[]> {
    return Array.from(this.centers.values());
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentsByCenter(centerId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.centerId === centerId
    );
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const studentIdPrefix = "STU-" + new Date().getFullYear() + "-";
    const studentId = studentIdPrefix + String(id).padStart(4, '0');
    
    const student: Student = { 
      ...insertStudent, 
      id,
      studentId,
      performanceRating: "Average",
      attendancePercentage: 0
    };
    
    this.students.set(id, student);
    
    // Update center's total students count
    const center = await this.getCenter(student.centerId);
    if (center) {
      await this.updateCenter(center.id, { 
        totalStudents: center.totalStudents + 1 
      });
    }
    
    return student;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const student = await this.getStudent(id);
    if (!student) return undefined;

    const updatedStudent = { ...student, ...studentData };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const student = await this.getStudent(id);
    if (!student) return false;
    
    const success = this.students.delete(id);
    
    // Update center's total students count
    if (success) {
      const center = await this.getCenter(student.centerId);
      if (center && center.totalStudents > 0) {
        await this.updateCenter(center.id, { 
          totalStudents: center.totalStudents - 1 
        });
      }
    }
    
    return success;
  }

  async listStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  // Staff operations
  async getStaff(id: number): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async getStaffByCenter(centerId: number): Promise<Staff[]> {
    return Array.from(this.staff.values()).filter(
      (staff) => staff.centerId === centerId
    );
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const id = this.staffIdCounter++;
    const now = new Date();
    const staffMember: Staff = { ...insertStaff, id, joiningDate: now };
    this.staff.set(id, staffMember);
    
    // Update center's total staff count
    const center = await this.getCenter(staffMember.centerId);
    if (center) {
      await this.updateCenter(center.id, { 
        totalStaff: center.totalStaff + 1 
      });
    }
    
    return staffMember;
  }

  async updateStaff(id: number, staffData: Partial<Staff>): Promise<Staff | undefined> {
    const staffMember = await this.getStaff(id);
    if (!staffMember) return undefined;

    const updatedStaff = { ...staffMember, ...staffData };
    this.staff.set(id, updatedStaff);
    return updatedStaff;
  }

  async deleteStaff(id: number): Promise<boolean> {
    const staffMember = await this.getStaff(id);
    if (!staffMember) return false;
    
    const success = this.staff.delete(id);
    
    // Update center's total staff count
    if (success) {
      const center = await this.getCenter(staffMember.centerId);
      if (center && center.totalStaff > 0) {
        await this.updateCenter(center.id, { 
          totalStaff: center.totalStaff - 1 
        });
      }
    }
    
    return success;
  }

  async listStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values());
  }

  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (attendance) => attendance.studentId === studentId
    );
  }

  async getAttendanceByCenter(centerId: number, date?: Date): Promise<Attendance[]> {
    let attendanceRecords = Array.from(this.attendance.values()).filter(
      (attendance) => attendance.centerId === centerId
    );
    
    if (date) {
      const dateString = date.toDateString();
      attendanceRecords = attendanceRecords.filter(
        (attendance) => attendance.date.toDateString() === dateString
      );
    }
    
    return attendanceRecords;
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceIdCounter++;
    const now = new Date();
    const attendanceRecord: Attendance = { ...insertAttendance, id, date: now };
    this.attendance.set(id, attendanceRecord);
    
    // Calculate and update the student's attendance percentage
    const student = await this.getStudent(insertAttendance.studentId);
    if (student) {
      const attendanceRecords = await this.getAttendanceByStudent(student.id);
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(record => record.status === "present").length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      
      await this.updateStudent(student.id, { attendancePercentage });
    }
    
    return attendanceRecord;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const attendanceRecord = await this.getAttendance(id);
    if (!attendanceRecord) return undefined;

    const updatedAttendance = { ...attendanceRecord, ...attendanceData };
    this.attendance.set(id, updatedAttendance);
    
    // Recalculate and update the student's attendance percentage
    const student = await this.getStudent(updatedAttendance.studentId);
    if (student) {
      const attendanceRecords = await this.getAttendanceByStudent(student.id);
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(record => record.status === "present").length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      
      await this.updateStudent(student.id, { attendancePercentage });
    }
    
    return updatedAttendance;
  }

  async listAttendance(): Promise<Attendance[]> {
    return Array.from(this.attendance.values());
  }

  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportsByCenter(centerId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.centerId === centerId
    );
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.reportIdCounter++;
    const now = new Date();
    const report: Report = { ...insertReport, id, generatedAt: now };
    this.reports.set(id, report);
    return report;
  }

  async deleteReport(id: number): Promise<boolean> {
    return this.reports.delete(id);
  }

  async listReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  // AI Insight operations
  async getAiInsight(id: number): Promise<AiInsight | undefined> {
    return this.aiInsights.get(id);
  }

  async getAiInsightsByCenter(centerId: number): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values()).filter(
      (insight) => insight.centerId === centerId
    );
  }

  async createAiInsight(insertInsight: InsertAiInsight): Promise<AiInsight> {
    const id = this.aiInsightIdCounter++;
    const now = new Date();
    const insight: AiInsight = { ...insertInsight, id, generatedAt: now };
    this.aiInsights.set(id, insight);
    return insight;
  }

  async deleteAiInsight(id: number): Promise<boolean> {
    return this.aiInsights.delete(id);
  }

  async listAiInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values());
  }
}

// Export the storage instance to be used throughout the application
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Center operations
  async getCenter(id: number): Promise<Center | undefined> {
    const [center] = await db.select().from(centers).where(eq(centers.id, id));
    return center;
  }

  async createCenter(insertCenter: InsertCenter): Promise<Center> {
    const [center] = await db.insert(centers).values(insertCenter).returning();
    return center;
  }

  async updateCenter(id: number, centerData: Partial<Center>): Promise<Center | undefined> {
    const [updatedCenter] = await db
      .update(centers)
      .set(centerData)
      .where(eq(centers.id, id))
      .returning();
    return updatedCenter;
  }

  async deleteCenter(id: number): Promise<boolean> {
    const result = await db.delete(centers).where(eq(centers.id, id));
    return result.rowCount > 0;
  }

  async listCenters(): Promise<Center[]> {
    return db.select().from(centers);
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentsByCenter(centerId: number): Promise<Student[]> {
    return db.select().from(students).where(eq(students.centerId, centerId));
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    // Generate student ID
    const studentIdPrefix = "STU-" + new Date().getFullYear() + "-";
    const [lastStudent] = await db
      .select({ maxId: sql<number>`MAX(${students.id})` })
      .from(students);
    
    const nextId = (lastStudent?.maxId || 0) + 1;
    const studentId = studentIdPrefix + String(nextId).padStart(4, '0');
    
    const [student] = await db
      .insert(students)
      .values({ ...insertStudent, studentId })
      .returning();
    
    // Update center's total students count
    const center = await this.getCenter(insertStudent.centerId);
    if (center) {
      await this.updateCenter(center.id, { 
        totalStudents: center.totalStudents + 1 
      });
    }
    
    return student;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const [updatedStudent] = await db
      .update(students)
      .set(studentData)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const student = await this.getStudent(id);
    if (student) {
      // Update center's total students count
      const center = await this.getCenter(student.centerId);
      if (center) {
        await this.updateCenter(center.id, { 
          totalStudents: Math.max(0, center.totalStudents - 1) 
        });
      }
    }
    
    const result = await db.delete(students).where(eq(students.id, id));
    return result.rowCount > 0;
  }

  async listStudents(): Promise<Student[]> {
    return db.select().from(students);
  }

  // Staff operations
  async getStaff(id: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staffTable).where(eq(staffTable.id, id));
    return staffMember;
  }

  async getStaffByCenter(centerId: number): Promise<Staff[]> {
    return db.select().from(staffTable).where(eq(staffTable.centerId, centerId));
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    console.log('DatabaseStorage.createStaff - input data:', insertStaff);
    
    try {
      // Check if the user exists
      const user = await this.getUser(insertStaff.userId);
      if (!user) {
        console.error('User not found with ID:', insertStaff.userId);
        throw new Error(`User with ID ${insertStaff.userId} not found`);
      }
      
      // Check if the center exists
      const center = await this.getCenter(insertStaff.centerId);
      if (!center) {
        console.error('Center not found with ID:', insertStaff.centerId);
        throw new Error(`Center with ID ${insertStaff.centerId} not found`);
      }
      
      console.log('Inserting staff with data:', insertStaff);
      const [staffMember] = await db.insert(staffTable).values(insertStaff).returning();
      console.log('Staff created in database:', staffMember);
      
      // Update center's total staff count
      await this.updateCenter(center.id, { 
        totalStaff: center.totalStaff + 1 
      });
      console.log('Center staff count updated');
      
      return staffMember;
    } catch (error) {
      console.error('Error in createStaff:', error);
      throw error;
    }
  }

  async updateStaff(id: number, staffData: Partial<Staff>): Promise<Staff | undefined> {
    // Check if centerId is being updated
    const oldStaff = await this.getStaff(id);
    if (oldStaff && staffData.centerId && oldStaff.centerId !== staffData.centerId) {
      // Update old center count
      const oldCenter = await this.getCenter(oldStaff.centerId);
      if (oldCenter) {
        await this.updateCenter(oldCenter.id, { totalStaff: Math.max(0, oldCenter.totalStaff - 1) });
      }
      
      // Update new center count
      const newCenter = await this.getCenter(staffData.centerId);
      if (newCenter) {
        await this.updateCenter(newCenter.id, { totalStaff: newCenter.totalStaff + 1 });
      }
    }
    
    const [updatedStaff] = await db
      .update(staffTable)
      .set(staffData)
      .where(eq(staffTable.id, id))
      .returning();
    return updatedStaff;
  }

  async deleteStaff(id: number): Promise<boolean> {
    const staffMember = await this.getStaff(id);
    if (staffMember) {
      // Update center's total staff count
      const center = await this.getCenter(staffMember.centerId);
      if (center) {
        await this.updateCenter(center.id, { 
          totalStaff: Math.max(0, center.totalStaff - 1) 
        });
      }
    }
    
    const result = await db.delete(staffTable).where(eq(staffTable.id, id));
    return result.rowCount > 0;
  }

  async listStaff(): Promise<Staff[]> {
    return db.select().from(staffTable);
  }

  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const [record] = await db.select().from(attendance).where(eq(attendance.id, id));
    return record;
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async getAttendanceByCenter(centerId: number, date?: Date): Promise<Attendance[]> {
    let query = db.select().from(attendance).where(eq(attendance.centerId, centerId));
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Create a new query with the date filter
      return db.select()
        .from(attendance)
        .where(
          and(
            eq(attendance.centerId, centerId),
            gte(attendance.date, startDate),
            lte(attendance.date, endDate)
          )
        );
    }
    
    return query;
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(insertAttendance).returning();
    
    // Update student's attendance percentage
    const student = await this.getStudent(insertAttendance.studentId);
    if (student) {
      const records = await this.getAttendanceByStudent(student.id);
      const presentCount = records.filter(r => r.status === "present").length;
      const percentage = Math.round((presentCount / records.length) * 100);
      
      await this.updateStudent(student.id, { attendancePercentage: percentage });
    }
    
    return record;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const [updatedRecord] = await db
      .update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    
    if (updatedRecord && attendanceData.status !== undefined) {
      // Update student's attendance percentage
      const student = await this.getStudent(updatedRecord.studentId);
      if (student) {
        const records = await this.getAttendanceByStudent(student.id);
        const presentCount = records.filter(r => r.status === "present").length;
        const percentage = Math.round((presentCount / records.length) * 100);
        
        await this.updateStudent(student.id, { attendancePercentage: percentage });
      }
    }
    
    return updatedRecord;
  }

  async listAttendance(): Promise<Attendance[]> {
    return db.select().from(attendance);
  }

  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReportsByCenter(centerId: number): Promise<Report[]> {
    return db.select().from(reports).where(eq(reports.centerId, centerId));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return result.rowCount > 0;
  }

  async listReports(): Promise<Report[]> {
    return db.select().from(reports);
  }

  // AI Insight operations
  async getAiInsight(id: number): Promise<AiInsight | undefined> {
    const [insight] = await db.select().from(aiInsights).where(eq(aiInsights.id, id));
    return insight;
  }

  async getAiInsightsByCenter(centerId: number): Promise<AiInsight[]> {
    return db.select().from(aiInsights).where(eq(aiInsights.centerId, centerId));
  }

  async createAiInsight(insertInsight: InsertAiInsight): Promise<AiInsight> {
    const [insight] = await db.insert(aiInsights).values(insertInsight).returning();
    return insight;
  }

  async deleteAiInsight(id: number): Promise<boolean> {
    const result = await db.delete(aiInsights).where(eq(aiInsights.id, id));
    return result.rowCount > 0;
  }

  async listAiInsights(): Promise<AiInsight[]> {
    return db.select().from(aiInsights);
  }
}

export const storage = new DatabaseStorage();
