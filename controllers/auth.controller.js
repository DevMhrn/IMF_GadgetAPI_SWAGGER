// backend/controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import  db  from '../models/index.js';

export const login = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password  || !name || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, email, role, and password are required'
      });
    }

    let user = await db.User.findOne({ where: { email } });
    if (!user) {
      user = await db.User.create({
        name,
        email,
        password,
        role,
        lastLogin: new Date()
      });
    } else {
      if (user.role !== role) {
        return res.status(401).json({
          error: 'Unauthorized role',
          message: `The name and email is an ${user.role}, you are unauthorized`
        });
      }
      if (user.password !== password) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Incorrect password'
        });
      }
      await user.update({ lastLogin: new Date() });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token: `Bearer ${token}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};