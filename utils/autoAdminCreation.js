import bcrypt from 'bcrypt';
import Admin from '../models/adminModel.js';

const initializeAdmin = async () => {
  try {
    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });

    if (existingAdmin) {
      return; // Exit if admin already exists
    }

    // Generate a hashed password
    const hashedPassword = await bcrypt.hash('admin@12345', 10);

    // Create the admin user
    await Admin.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin', // Add role for future access control
    });

  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
  }
};

export default initializeAdmin;
