import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import { WebSocketServer } from 'ws';
import { WebSocket } from 'ws';
import { insertUserSchema, insertCenterSchema, insertStudentSchema, insertStaffSchema, insertAttendanceSchema, insertReportSchema, insertAiInsightSchema } from "@shared/schema";

// For AI insights generation
const OpenRouterApiKey = process.env.OPENROUTER_API_KEY || ""; 

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup session
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'pehachan-ngo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400000 }, // 24 hours
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        
        // In a real app, passwords would be hashed and properly compared
        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth middleware
  const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };

  const checkRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userRole = (req.user as any)?.role;
      
      // Role hierarchy (higher number = higher permission level)
      const roleHierarchy = {
        ghost: 5,       // Highest level - can do everything
        founder: 4,     // Founder of the NGO
        admin: 3,       // Administrative staff
        center_manager: 2, // Managers of individual centers
        project_intern: 1, // Project interns
        teaching_intern: 0, // Teaching interns - lowest level
      };
      
      // If the user has the exact role required, allow access
      if (roles.includes(userRole)) {
        return next();
      }
      
      // If the user has the ghost role, allow access to everything
      if (userRole === 'ghost') {
        return next();
      }
      
      // Check if the user's role level is higher than or equal to the required level
      const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] !== undefined
        ? roleHierarchy[userRole as keyof typeof roleHierarchy]
        : -1;
        
      // Get the highest required role level from the required roles
      const requiredRoleLevel = Math.max(
        ...roles.map(role => 
          roleHierarchy[role as keyof typeof roleHierarchy] !== undefined 
            ? roleHierarchy[role as keyof typeof roleHierarchy] 
            : -1
        )
      );
      
      if (userRoleLevel >= requiredRoleLevel) {
        return next();
      }
      
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    };
  };

  // Center-specific permission middleware
  const checkCenterAccess = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = req.user as any;
    const userRole = user?.role;
    const userId = user?.id;
    
    // Determine centerId from various possible locations in the request
    const centerId = 
      Number(req.params.centerId) || 
      Number(req.params.id) || 
      Number(req.body.centerId) ||
      Number(req.query.centerId);
    
    // If no centerId is specified in the request (e.g., for listing all reports/insights)
    // and user has higher roles, allow access
    if (!centerId || isNaN(centerId)) {
      // Higher roles (ghost, founder, admin) have access to all centers and data
      if (userRole === 'ghost' || userRole === 'founder' || userRole === 'admin') {
        return next();
      }
    }

    // Higher roles (ghost, founder, admin) have access to all centers
    if (userRole === 'ghost' || userRole === 'founder' || userRole === 'admin') {
      return next();
    }

    // For center managers, project interns, and teaching interns,
    // check if they belong to the requested center
    (async () => {
      try {
        // Get staff record for the user
        const staffMembers = await storage.listStaff();
        const staffMember = staffMembers.find(s => s.userId === userId);

        if (!staffMember) {
          return res.status(403).json({ 
            message: 'Forbidden: You are not assigned to any center' 
          });
        }

        // If listing all centers (no specific centerId), allow access only to their center's data
        if (!centerId || isNaN(centerId)) {
          // This will be filtered in the route handler to show only their center's data
          return next();
        }

        // Check if the staff member belongs to the requested center
        if (staffMember.centerId === centerId) {
          return next();
        }

        return res.status(403).json({ 
          message: 'Forbidden: You do not have access to this center' 
        });
      } catch (error) {
        console.error('Error checking center access:', error);
        return res.status(500).json({ 
          message: 'Internal server error while checking permissions' 
        });
      }
    })();
  };

  // Authentication routes
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: Error | null, user: any, info: { message: string } | undefined) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error during authentication' });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Authentication failed' });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Login session error:', loginErr);
          return res.status(500).json({ message: 'Failed to create login session' });
        }
        
        console.log('User logged in successfully:', user.username);
        
        // Send user data without password
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        return res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    const wasAuthenticated = req.isAuthenticated();
    req.logout(() => {
      console.log('User logged out, was authenticated:', wasAuthenticated);
      res.json({ success: true });
    });
  });

  app.get('/api/auth/current-user', (req, res) => {
    console.log('Current user check - auth state:', req.isAuthenticated(), 'user:', req.user);
    
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Send user data without password
    const userWithoutPassword = { ...req.user } as any;
    delete userWithoutPassword.password;
    
    res.json({ user: userWithoutPassword });
  });

  // Users routes
  app.get('/api/users', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), async (req, res) => {
    try {
      console.log('Creating user with data:', req.body);
      const validatedData = insertUserSchema.parse(req.body);
      console.log('Validated user data:', validatedData);
      
      // Check if a user with this email already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        console.log('User with this email already exists');
        return res.status(400).json({ 
          message: 'User with this email already exists', 
          code: 'EMAIL_EXISTS',
          field: 'email' 
        });
      }
      
      // Check if a user with this username already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        console.log('User with this username already exists');
        return res.status(400).json({ 
          message: 'User with this username already exists', 
          code: 'USERNAME_EXISTS',
          field: 'username' 
        });
      }
      
      const user = await storage.createUser(validatedData);
      console.log('User created successfully:', user);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      
      // Check for database constraint violations (unique constraints)
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('unique constraint') && errorMsg.includes('email')) {
          return res.status(400).json({ 
            message: 'This email address is already in use', 
            code: 'EMAIL_EXISTS',
            field: 'email' 
          });
        }
        if (errorMsg.includes('unique constraint') && errorMsg.includes('username')) {
          return res.status(400).json({ 
            message: 'This username is already taken', 
            code: 'USERNAME_EXISTS',
            field: 'username' 
          });
        }
      }
      
      res.status(500).json({ message: 'Failed to create user', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/users/:id', ensureAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.patch('/api/users/:id', ensureAuthenticated, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const currentUser = req.user as any;
      
      // Get the user's current role
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check permissions for role change
      if (req.body.role && userToUpdate.role !== req.body.role) {
        // If it's a user with username 'ghost' updating their own role - allow it regardless of permissions
        // This ensures a ghost user can always switch back to ghost role, even if currently in another role
        if (currentUser.username === 'ghost' && currentUser.id === userId) {
          console.log('Ghost user changing their role from', userToUpdate.role, 'to', req.body.role);
          // Allow ghost user to change their own role
        } 
        // Otherwise, enforce normal permission checks for role changes
        else if (currentUser.role !== 'ghost' && currentUser.role !== 'founder' && currentUser.role !== 'admin') {
          return res.status(403).json({ message: 'Insufficient permissions to change user roles' });
        }
      } 
      // For other updates (not role changes), ensure user has appropriate permissions or is updating themselves
      else if (currentUser.id !== userId && 
               currentUser.role !== 'ghost' && 
               currentUser.role !== 'founder' && 
               currentUser.role !== 'admin') {
        return res.status(403).json({ message: 'Insufficient permissions to update other users' });
      }
      
      // Process the update
      const user = await storage.updateUser(userId, req.body);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:id', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), async (req, res) => {
    try {
      const result = await storage.deleteUser(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Centers routes
  app.get('/api/centers', async (req, res) => {
    try {
      const centers = await storage.listCenters();
      res.json(centers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch centers' });
    }
  });

  app.post('/api/centers', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), async (req, res) => {
    try {
      const validatedData = insertCenterSchema.parse(req.body);
      const center = await storage.createCenter(validatedData);
      res.status(201).json(center);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create center' });
    }
  });

  app.get('/api/centers/:id', async (req, res) => {
    try {
      const center = await storage.getCenter(Number(req.params.id));
      if (!center) {
        return res.status(404).json({ message: 'Center not found' });
      }
      res.json(center);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch center' });
    }
  });

  app.patch('/api/centers/:id', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin', 'center_manager']), async (req, res) => {
    try {
      const center = await storage.updateCenter(Number(req.params.id), req.body);
      if (!center) {
        return res.status(404).json({ message: 'Center not found' });
      }
      res.json(center);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update center' });
    }
  });

  app.delete('/api/centers/:id', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), async (req, res) => {
    try {
      const result = await storage.deleteCenter(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Center not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete center' });
    }
  });

  // Students routes
  app.get('/api/students', ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userRole = user?.role;
      const userId = user?.id;
      
      // If the user is a teaching intern, ensure they are assigned to a center
      if (userRole === 'teaching_intern') {
        const staffMembers = await storage.listStaff();
        const staffMember = staffMembers.find(s => s.userId === userId);
        
        if (!staffMember) {
          return res.status(403).json({ message: 'Forbidden: You are not assigned to any center' });
        }
      }
      
      // If a specific center ID is provided, fetch students for that center
      if (req.query.centerId) {
        const students = await storage.getStudentsByCenter(Number(req.query.centerId));
        return res.json(students);
      } 
      // If no center ID is provided, allow all users (including teaching interns) to view all students
      else {
        const students = await storage.listStudents();
        return res.json(students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  });

  app.post('/api/students', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin', 'center_manager', 'project_intern', 'teaching_intern']), checkCenterAccess, async (req, res) => {
    try {
      console.log('Creating student with data:', JSON.stringify(req.body, null, 2));
      
      // First, validate the input data
      let studentData;
      try {
        const validatedData = insertStudentSchema.parse(req.body);
        console.log('Validated student data:', JSON.stringify(validatedData, null, 2));
        
        // Get center information to generate the studentId
        const center = await storage.getCenter(validatedData.centerId);
        if (!center) {
          return res.status(404).json({ message: 'Center not found' });
        }
        
        // Generate a unique studentId that includes center information
        // Format: "PCNNN-CCC-YYYY"
        // P = "P" for Pehachan
        // C = Center initial (first letter of center name)
        // NNN = Random 3-digit sequence
        // CCC = Center ID with leading zeros
        // YYYY = Current year
        
        const currentYear = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 900) + 100; // 3-digit number between 100-999
        const centerInitial = center.name.charAt(0).toUpperCase();
        const centerIdStr = center.id.toString().padStart(3, '0');
        
        const studentId = `P${centerInitial}${randomNum}-${centerIdStr}-${currentYear}`;
        
        // Create the student data with the generated studentId
        // We need to do this because the Zod schema doesn't allow studentId as an input
        studentData = {
          name: validatedData.name,
          centerId: validatedData.centerId,
          gender: validatedData.gender,
          age: validatedData.age,
          grade: validatedData.grade,
          guardianName: validatedData.guardianName,
          address: validatedData.address || null,
          contactNumber: validatedData.contactNumber || null,
          active: validatedData.active !== undefined ? validatedData.active : true,
          studentId // Add the generated ID
        };
        
        console.log('Final student data to save:', JSON.stringify(studentData, null, 2));
        
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.log('Student validation error:', validationError.errors);
          return res.status(400).json({ 
            message: 'Validation error', 
            errors: validationError.errors,
            requestData: req.body
          });
        }
        throw validationError;
      }
      
      // We need to add studentId as a runtime property since the schema is dynamically generated
      // This is a workaround for TypeScript complaining about 'studentId' not existing in the schema
      const finalStudentData = {
        ...studentData,
      } as any; // Use type assertion to bypass TypeScript checking
      
      const student = await storage.createStudent(finalStudentData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating student:', error);
      res.status(500).json({ message: 'Failed to create student' });
    }
  });

  app.get('/api/students/:id', ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userRole = user?.role;
      const userId = user?.id;
      
      const student = await storage.getStudent(Number(req.params.id));
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // For teaching interns, just make sure they are assigned to a center
      // but allow them to view details of any student
      if (userRole === 'teaching_intern') {
        // Get the teaching intern's center assignment
        const staffMembers = await storage.listStaff();
        const staffMember = staffMembers.find(s => s.userId === userId);
        
        if (!staffMember) {
          return res.status(403).json({ message: 'Forbidden: You are not assigned to any center' });
        }
      }
      
      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ message: 'Failed to fetch student' });
    }
  });

  app.patch('/api/students/:id', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin', 'center_manager', 'project_intern', 'teaching_intern']), checkCenterAccess, async (req, res) => {
    try {
      const student = await storage.updateStudent(Number(req.params.id), req.body);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update student' });
    }
  });

  app.delete('/api/students/:id', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin', 'center_manager']), checkCenterAccess, async (req, res) => {
    try {
      const result = await storage.deleteStudent(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete student' });
    }
  });

  // Staff routes
  app.get('/api/staff', ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userRole = user?.role;
      const userId = user?.id;
      
      // Special case for teaching interns - ensure they are assigned to a center
      if (userRole === 'teaching_intern') {
        const staffMembers = await storage.listStaff();
        const staffMember = staffMembers.find(s => s.userId === userId);
        
        if (!staffMember) {
          return res.status(403).json({ message: 'Forbidden: You are not assigned to any center' });
        }
      }
      
      // If a specific center ID is provided
      if (req.query.centerId) {
        // Ensure centerId is a valid number
        try {
          // Convert the query parameter to a string first, then to a number
          const centerId = Number(String(req.query.centerId));
          
          if (isNaN(centerId)) {
            console.error('Invalid centerId:', req.query.centerId);
            return res.status(400).json({ message: 'Invalid center ID' });
          }
          
          const staffMembers = await storage.getStaffByCenter(centerId);
          return res.json(staffMembers);
        } catch (err) {
          console.error('Error parsing centerId:', err);
          return res.status(400).json({ message: 'Invalid center ID format' });
        }
      } 
      // If no specific center ID is provided (listing all staff)
      else {
        // Higher roles (ghost, founder, admin) can see all staff
        if (userRole === 'ghost' || userRole === 'founder' || userRole === 'admin') {
          const staffMembers = await storage.listStaff();
          return res.json(staffMembers);
        }
        
        // Center managers, project interns, and teaching interns can only see staff from their centers
        const staffMembers = await storage.listStaff();
        const staffMember = staffMembers.find(s => s.userId === userId);
        
        if (!staffMember) {
          return res.status(403).json({ message: 'Forbidden: You are not assigned to any center' });
        }
        
        // Get staff only from their assigned center
        const centerStaff = await storage.getStaffByCenter(staffMember.centerId);
        return res.json(centerStaff);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ message: 'Failed to fetch staff' });
    }
  });

  app.post('/api/staff', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), async (req, res) => {
    try {
      console.log('Creating staff with data:', req.body);
      const validatedData = insertStaffSchema.parse(req.body);
      console.log('Validated staff data:', validatedData);
      const staffMember = await storage.createStaff(validatedData);
      console.log('Staff created successfully:', staffMember);
      res.json(staffMember);
    } catch (error) {
      console.error('Error creating staff:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create staff member', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/staff/:id', ensureAuthenticated, async (req, res) => {
    try {
      const staffMember = await storage.getStaff(Number(req.params.id));
      if (!staffMember) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      res.json(staffMember);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch staff member' });
    }
  });

  app.patch('/api/staff/:id', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), async (req, res) => {
    try {
      const staffMember = await storage.updateStaff(Number(req.params.id), req.body);
      if (!staffMember) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      res.json(staffMember);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update staff member' });
    }
  });

  app.delete('/api/staff/:id', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), async (req, res) => {
    try {
      const result = await storage.deleteStaff(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete staff member' });
    }
  });

  // Attendance routes
  app.get('/api/attendance', ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userRole = user?.role;
      const userId = user?.id;
      
      // For teaching interns, ensure they are assigned to a center
      if (userRole === 'teaching_intern') {
        const staffMembers = await storage.listStaff();
        const staffMember = staffMembers.find(s => s.userId === userId);
        
        if (!staffMember) {
          return res.status(403).json({ message: 'Forbidden: You are not assigned to any center' });
        }
      }
      
      // If a specific student ID is provided
      if (req.query.studentId) {
        const attendanceRecords = await storage.getAttendanceByStudent(Number(req.query.studentId));
        return res.json(attendanceRecords);
      } 
      // If a specific center ID is provided
      else if (req.query.centerId) {
        const date = req.query.date ? new Date(req.query.date as string) : undefined;
        const attendanceRecords = await storage.getAttendanceByCenter(Number(req.query.centerId), date);
        return res.json(attendanceRecords);
      } 
      // If no specific filter is provided
      else {
        // Higher roles (ghost, founder, admin) can see all attendance records
        if (userRole === 'ghost' || userRole === 'founder' || userRole === 'admin') {
          const attendanceRecords = await storage.listAttendance();
          return res.json(attendanceRecords);
        }
        
        // For other roles, find their center and show attendance from it
        const staffMembers = await storage.listStaff();
        const staffMember = staffMembers.find(s => s.userId === userId);
        
        if (!staffMember) {
          return res.status(403).json({ message: 'Forbidden: You are not assigned to any center' });
        }
        
        // Get attendance records only from their assigned center
        const attendanceRecords = await storage.getAttendanceByCenter(staffMember.centerId);
        return res.json(attendanceRecords);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      res.status(500).json({ message: 'Failed to fetch attendance records' });
    }
  });

  app.post('/api/attendance', ensureAuthenticated, checkCenterAccess, async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendanceRecord = await storage.createAttendance({
        ...validatedData,
        markedBy: (req.user as any).id
      });
      res.status(201).json(attendanceRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create attendance record' });
    }
  });

  app.patch('/api/attendance/:id', ensureAuthenticated, checkCenterAccess, async (req, res) => {
    try {
      const attendanceRecord = await storage.updateAttendance(Number(req.params.id), req.body);
      if (!attendanceRecord) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }
      res.json(attendanceRecord);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update attendance record' });
    }
  });

  // Reports routes
  app.get('/api/reports', ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userRole = user?.role;
      let reports;

      // Users with higher roles can access all reports
      if (['ghost', 'founder', 'admin'].includes(userRole)) {
        if (req.query.centerId) {
          // Ensure centerId is a valid number
          try {
            // Convert the query parameter to a string first, then to a number
            const centerId = Number(String(req.query.centerId));
            
            if (isNaN(centerId)) {
              console.error('Invalid centerId for reports:', req.query.centerId);
              return res.status(400).json({ message: 'Invalid center ID' });
            }
            
            reports = await storage.getReportsByCenter(centerId);
          } catch (err) {
            console.error('Error parsing centerId for reports:', err);
            return res.status(400).json({ message: 'Invalid center ID format' });
          }
        } else {
          reports = await storage.listReports();
        }
      } else {
        // For lower roles, find their center and only show reports for that center
        const staffMembers = await storage.listStaff();
        const staffMember = staffMembers.find(s => s.userId === user.id);
        
        if (!staffMember) {
          return res.status(403).json({ message: 'You are not assigned to any center' });
        }
        
        reports = await storage.getReportsByCenter(staffMember.centerId);
      }
      
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  app.post('/api/reports', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin', 'center_manager']), checkCenterAccess, async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport({
        ...validatedData,
        generatedBy: (req.user as any).id
      });
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create report' });
    }
  });

  app.get('/api/reports/:id', ensureAuthenticated, checkCenterAccess, async (req, res) => {
    try {
      const report = await storage.getReport(Number(req.params.id));
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch report' });
    }
  });

  app.delete('/api/reports/:id', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), checkCenterAccess, async (req, res) => {
    try {
      const result = await storage.deleteReport(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete report' });
    }
  });

  // AI Insights routes
  app.get('/api/ai-insights', ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userRole = user?.role;
      let insights;

      // Users with higher roles can access all insights
      if (['ghost', 'founder', 'admin'].includes(userRole)) {
        if (req.query.centerId) {
          // Ensure centerId is a valid number
          try {
            // Convert the query parameter to a string first, then to a number
            const centerId = Number(String(req.query.centerId));
            
            if (isNaN(centerId)) {
              console.error('Invalid centerId for AI insights:', req.query.centerId);
              return res.status(400).json({ message: 'Invalid center ID' });
            }
            
            insights = await storage.getAiInsightsByCenter(centerId);
          } catch (err) {
            console.error('Error parsing centerId for AI insights:', err);
            return res.status(400).json({ message: 'Invalid center ID format' });
          }
        } else {
          insights = await storage.listAiInsights();
        }
      } else {
        // For lower roles, find their center and only show insights for that center
        const staffMembers = await storage.listStaff();
        const staffMember = staffMembers.find(s => s.userId === user.id);
        
        if (!staffMember) {
          return res.status(403).json({ message: 'You are not assigned to any center' });
        }
        
        insights = await storage.getAiInsightsByCenter(staffMember.centerId);
      }
      
      res.json(insights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      res.status(500).json({ message: 'Failed to fetch AI insights' });
    }
  });

  app.post('/api/ai-insights', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), checkCenterAccess, async (req, res) => {
    try {
      const validatedData = insertAiInsightSchema.parse(req.body);
      const insight = await storage.createAiInsight(validatedData);
      res.status(201).json(insight);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create AI insight' });
    }
  });

  app.get('/api/ai-insights/:id', ensureAuthenticated, checkCenterAccess, async (req, res) => {
    try {
      const insight = await storage.getAiInsight(Number(req.params.id));
      if (!insight) {
        return res.status(404).json({ message: 'AI insight not found' });
      }
      res.json(insight);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch AI insight' });
    }
  });

  app.delete('/api/ai-insights/:id', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), checkCenterAccess, async (req, res) => {
    try {
      const result = await storage.deleteAiInsight(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'AI insight not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete AI insight' });
    }
  });

  // Generate AI insights using OpenRouter API
  app.post('/api/generate-insight', ensureAuthenticated, checkRole(['ghost', 'founder', 'admin']), checkCenterAccess, async (req, res) => {
    try {
      if (!OpenRouterApiKey) {
        return res.status(500).json({ message: 'OpenRouter API key not configured' });
      }

      const { prompt, centerId } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OpenRouterApiKey}`,
          'HTTP-Referer': 'https://pehachan-ngo.org',
          'X-Title': 'Pehachan NGO Management System'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-opus',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant helping an NGO analyze educational data to provide insights. Generate clear, actionable insights based on the provided information. Format your response as a JSON object with title, description, category, and data fields.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        return res.status(500).json({ message: 'Failed to generate AI insight' });
      }

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);

      // Save the insight
      const insight = await storage.createAiInsight({
        title: aiResponse.title,
        description: aiResponse.description,
        category: aiResponse.category,
        centerId: centerId ? Number(centerId) : undefined,
        data: aiResponse.data || {}
      });

      res.json(insight);
    } catch (error) {
      console.error('AI insight generation error:', error);
      res.status(500).json({ message: 'Failed to generate AI insight' });
    }
  });

  // Summary dashboard statistics
  app.get('/api/dashboard/stats', ensureAuthenticated, async (req, res) => {
    try {
      const centers = await storage.listCenters();
      const students = await storage.listStudents();
      const staffMembers = await storage.listStaff();
      
      // Calculate today's attendance percentage
      const today = new Date();
      const todayString = today.toDateString();
      const attendanceRecords = await storage.listAttendance();
      const todayAttendance = attendanceRecords.filter(record => {
        if (!record.date) return false;
        return new Date(record.date).toDateString() === todayString;
      });
      
      const todayAttendancePercentage = todayAttendance.length > 0
        ? (todayAttendance.filter(record => record.status === 'present').length / todayAttendance.length) * 100
        : 0;
      
      // Calculate changes for statistics
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const lastQuarter = new Date();
      lastQuarter.setMonth(lastQuarter.getMonth() - 3);
      
      // Calculate student change percentage from last month
      const newStudents = students.filter(student => 
        student.enrollmentDate && new Date(student.enrollmentDate) > lastMonth
      ).length;
      const studentChange = students.length > 0 ? Math.round((newStudents / students.length) * 100) : 0;
      
      // Calculate center change percentage from last quarter
      const newCenters = centers.filter(center => 
        center.createdAt && new Date(center.createdAt) > lastQuarter
      ).length;
      const centerChange = centers.length > 0 ? Math.round((newCenters / centers.length) * 100) : 0;
      
      // Calculate staff change percentage from last month
      const newStaff = staffMembers.filter(staff => 
        staff.joiningDate && new Date(staff.joiningDate) > lastMonth
      ).length;
      const staffChange = staffMembers.length > 0 ? Math.round((newStaff / staffMembers.length) * 100) : 0;
      
      // Calculate attendance change compared to average
      const pastWeek = new Date();
      pastWeek.setDate(pastWeek.getDate() - 7);
      const pastWeekAttendance = attendanceRecords.filter(record => 
        record.date && new Date(record.date) > pastWeek && new Date(record.date) < today
      );
      
      const pastWeekAttendancePercentage = pastWeekAttendance.length > 0
        ? (pastWeekAttendance.filter(record => record.status === 'present').length / pastWeekAttendance.length) * 100
        : 0;
      
      const attendanceChange = Math.round(todayAttendancePercentage - pastWeekAttendancePercentage);
      
      res.json({
        totalStudents: students.length,
        activeCenters: centers.filter(center => center.active).length,
        totalCenters: centers.length,
        todayAttendance: Math.round(todayAttendancePercentage),
        totalStaff: staffMembers.length,
        // Change metrics
        studentChange,
        newStudents,
        centerChange,
        newCenters,
        staffChange,
        newStaff,
        attendanceChange
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  });

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Add additional error handling
    clientTracking: true,
    // Set a ping interval to keep connections alive
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Below options specified as default values
      concurrencyLimit: 10,
      threshold: 1024 // Size in bytes below which messages should not be compressed
    }
  });
  
  // Store active connections with last activity timestamp
  interface ClientInfo {
    ws: WebSocket;
    lastActivity: Date;
  }
  
  const clients = new Map<WebSocket, ClientInfo>();
  
  // Setup heartbeat interval to detect dead connections
  const heartbeatInterval = 30000; // 30 seconds
  
  const heartbeat = () => {
    const now = new Date();
    // Check for stale connections and clean them up
    clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        const timeSinceLastActivity = now.getTime() - clientInfo.lastActivity.getTime();
        
        // If client hasn't been active for a long time, consider it stale
        if (timeSinceLastActivity > heartbeatInterval * 3) { // 90 seconds
          console.log('Closing stale WebSocket connection');
          ws.terminate(); // Force close
          clients.delete(ws);
        }
      } else if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        clients.delete(ws);
      }
    });
    
    // Send heartbeat to active clients
    broadcastUpdate('connection', { status: 'heartbeat', timestamp: now.toISOString() });
  };
  
  // Start heartbeat interval
  const heartbeatTimer = setInterval(heartbeat, heartbeatInterval);
  
  // Ensure we clean up on server shutdown
  process.on('SIGINT', () => {
    clearInterval(heartbeatTimer);
    wss.close();
    process.exit(0);
  });
  
  // Handle WebSocket server errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Track client with last activity timestamp
    clients.set(ws, { 
      ws, 
      lastActivity: new Date() 
    });
    
    // Send initial connection confirmation safely
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'connection', 
          status: 'connected',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
    
    // Handle incoming messages
    ws.on('message', (message) => {
      // Update last activity timestamp
      if (clients.has(ws)) {
        clients.set(ws, { 
          ws, 
          lastActivity: new Date() 
        });
      }
      
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);
        
        // Handle specific message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ 
            type: 'pong', 
            timestamp: new Date().toISOString() 
          }));
        }
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', (code, reason) => {
      console.log(`WebSocket client disconnected: ${code} ${reason}`);
      clients.delete(ws);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      // On error, try to close properly and then remove
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1011, 'Internal server error');
        }
      } catch (e) {
        console.error('Error while closing errored WebSocket:', e);
      }
      clients.delete(ws);
    });
    
    // Handle pong responses
    ws.on('pong', () => {
      if (clients.has(ws)) {
        clients.set(ws, { 
          ws, 
          lastActivity: new Date() 
        });
      }
    });
  });
  
  // Helper function to broadcast updates to all connected clients
  const broadcastUpdate = (type: string, data: any) => {
    const message = JSON.stringify({ 
      type, 
      data, 
      timestamp: new Date().toISOString() 
    });
    
    let activeClients = 0;
    let failedClients = 0;
    
    clients.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
          activeClients++;
        } catch (error) {
          console.error('Error sending broadcast to client:', error);
          failedClients++;
          // Mark for cleanup on next interval
          clients.delete(ws);
        }
      } else {
        // Clean up non-open connections
        clients.delete(ws);
      }
    });
    
    // Only log if it's not a heartbeat (to avoid spam)
    if (type !== 'connection' || data.status !== 'heartbeat') {
      console.log(`Broadcast ${type} to ${activeClients} clients (${failedClients} failed)`);
    }
  };
  
  // Middleware to broadcast updates after data changes
  const broadcastMiddleware = (req: Request, res: Response, next: Function) => {
    // Store the original res.json method
    const originalJson = res.json;
    
    // Override res.json to intercept the response
    res.json = function(body?: any): Response {
      // Call the original method
      originalJson.call(this, body);
      
      // Check if this is a mutation (POST, PUT, PATCH, DELETE)
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        // Extract the entity type from the URL
        const url = req.originalUrl || req.url;
        const entityMatch = url.match(/\/api\/([a-zA-Z-]+)/);
        
        if (entityMatch && entityMatch[1]) {
          const entityType = entityMatch[1];
          console.log(`Broadcasting ${req.method} update for ${entityType}`);
          
          // Broadcast the update
          broadcastUpdate(
            `${entityType.toUpperCase()}_UPDATED`,
            { method: req.method, entity: entityType, data: body }
          );
        }
      }
      
      return this;
    };
    
    next();
  };
  
  // Apply the broadcast middleware
  app.use(broadcastMiddleware);

  return httpServer;
}
