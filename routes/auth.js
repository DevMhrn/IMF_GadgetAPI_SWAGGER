import express from 'express';
import { login } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({
      message: 'IMF Gadget API - Operation, Keep it secret, keep it safe',
      documentation: '/api-docs',
      status: 'SECRET'
    });
});
router.post('/login', login);

export default router;

