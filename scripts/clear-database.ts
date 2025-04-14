import { db, pool } from '../server/db';
import { sql } from 'drizzle-orm';

async function clearDatabaseExceptGhost() {
  console.log('Starting database cleanup...');
  
  try {
    // Start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Step 1: Delete all data from dependent tables first
      console.log('Deleting attendance records...');
      await tx.execute(sql`DELETE FROM attendance`);
      
      console.log('Deleting reports...');
      await tx.execute(sql`DELETE FROM reports`);
      
      console.log('Deleting AI insights...');
      await tx.execute(sql`DELETE FROM ai_insights`);

      // Step 2: Delete staff records
      console.log('Deleting staff members...');
      await tx.execute(sql`DELETE FROM staff`);
      
      // Step 3: Delete students
      console.log('Deleting students...');
      await tx.execute(sql`DELETE FROM students`);
      
      // Step 4: Delete centers
      console.log('Deleting centers...');
      await tx.execute(sql`DELETE FROM centers`);
      
      // Step 5: Delete users except ghost
      console.log('Deleting users (except ghost)...');
      await tx.execute(sql`DELETE FROM users WHERE role != 'ghost'`);
      
      console.log('Database cleanup completed successfully.');
    });
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    // Close the database connection pool
    await pool.end();
    process.exit(0);
  }
}

// Run the function
clearDatabaseExceptGhost();