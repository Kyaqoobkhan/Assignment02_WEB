 const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
    try {
        console.log('Signup endpoint hit');
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        console.log('User created successfully:', newUser);
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error('Error in /signup:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Signin route
router.post('/signin', async (req, res) => {
    try {
        console.log('Signin endpoint hit');
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare the provided password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate a JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('User signed in successfully:', user.email);
        res.status(200).json({ token });
    } catch (err) {
        console.error('Error in /signin:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Protected route
router.get('/protected', (req, res) => {
    try {
        console.log('Protected route hit');
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.error('Token verification failed:', err);
                return res.status(403).json({ message: 'Forbidden' });
            }

            console.log('Token verified successfully:', user);
            res.status(200).json({ message: 'Access granted', user });
        });
    } catch (err) {
        console.error('Error in /protected:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
