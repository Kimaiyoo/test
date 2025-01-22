require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('./models/User'); 
const Expense = require('./models/Expense');
const sequelize = require('./config'); 

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
});
app.use(limiter);

const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
};

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes to serve your HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/add_expense', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add_expense.html'));
});

app.get('/edit_expense', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'edit_expense.html'));
});

app.get('/view_expense', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view_expense.html'));
});

sequelize.sync()
    .then(() => {
        console.log('Database & tables created!');
    })
    .catch((err) => {
        console.error('Error syncing database:', err);
    });

// User registration endpoint
app.post('/api/auth/register', [
    body('username').isLength({ min: 5 }).withMessage('Username must be at least 5 characters long'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            console.log('User already exists:', existingUser);
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        console.log('User registered successfully:', newUser);
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateAccessToken({ id: user.id, username: user.username });
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add Expense endpoint
app.post('/api/expenses', authenticateToken, async (req, res) => {
    const { date, description, amount } = req.body;

    if (!date || !description || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const newExpense = await Expense.create({
            user_id: req.user.id, 
            date,
            description,
            amount
        });

        res.status(201).json({ message: 'Expense added successfully', expense: newExpense });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// View Expenses endpoint
app.get('/api/expenses', authenticateToken, async (req, res) => {
    try {
        const expenses = await Expense.findAll({
            where: { user_id: req.user.id } 
        });

        res.status(200).json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Edit Expense endpoint
app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
    const { date, description, amount } = req.body;
    const expenseId = req.params.id;

    try {
        const expense = await Expense.findOne({
            where: {
                expense_id: expenseId,
                user_id: req.user.id
            }
        });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await expense.update({ date, description, amount });

        res.status(200).json({ message: 'Expense updated successfully', expense });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
