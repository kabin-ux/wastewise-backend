import bcrypt from 'bcrypt';
import Admin from '../models/adminModel.js';

const initializeAdmin = async (req, res) => {
  try {
    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ where: { email: 'admin@example.com' } });

    if (existingAdmin) {
      return; // Exit if admin already exists
    }

    // Generate a hashed password
    const hashedPassword = await bcrypt.hash('admin@12345', 10);

    // Create the admin user
    const newAdmin = await Admin.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
    });

    res.status(200).json({
      StatusCode:200,
      IsSuccess: true,
      Message: "Admmin initialized successfully"
    })
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
};

export default initializeAdmin;
