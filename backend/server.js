const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sequelize, User, Contact } = require('./models');
const { Op } = require('sequelize'); // Import Sequelize's Op object

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Authentication Routes
app.post('/signup', async (req, res) => {
  const { username, password, reason_for_access } = req.body;
  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      password: hashedPassword,
      approved: false, // User needs admin approval
      reason_for_access,
    });
    res.status(200).json({ message: 'User signed up successfully. Waiting for Admin approval.' });
  } catch (err) {
    console.error('Error signing up:', err);  // Log the detailed error
    res.status(500).json({ message: 'Error signing up', error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.approved) {
      return res.status(403).json({ message: 'Waiting for Admin approval' });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ username, level: user.level }, 'secret_key', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error logging in:', err);  // Log the detailed error
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// User Management Routes
app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

app.put('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.approved = true;
    await user.save();
    res.status(200).json({ message: 'User approved successfully' });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ message: 'Error approving user', error: err.message });
  }
});

app.put('/users/:id/level', async (req, res) => {
  const { level } = req.body;
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.level = level;
    await user.save();
    res.status(200).json({ message: 'User level updated successfully' });
  } catch (err) {
    console.error('Error updating user level:', err);
    res.status(500).json({ message: 'Error updating user level', error: err.message });
  }
});

// Contact Management Routes
app.get('/contacts', async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = search
      ? { [Op.or]: [{ first_name: { [Op.like]: `%${search}%` } }, { last_name: { [Op.like]: `%${search}%` } }] }
      : {};

    const contacts = await Contact.findAll({ where: whereClause });
    res.status(200).json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ message: 'Error fetching contacts', error: err.message });
  }
});

app.post('/contacts', async (req, res) => {
  const { first_name, last_name, phone_number } = req.body;
  try {
    await Contact.create({ first_name, last_name, phone_number });
    res.status(201).json({ message: 'Contact created successfully' });
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ message: 'Error creating contact', error: err.message });
  }
});

app.put('/contacts/:id', async (req, res) => {
  const { first_name, last_name, phone_number } = req.body;
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    contact.first_name = first_name;
    contact.last_name = last_name;
    contact.phone_number = phone_number;
    await contact.save();
    res.status(200).json({ message: 'Contact updated successfully' });
  } catch (err) {
    console.error('Error updating contact:', err);
    res.status(500).json({ message: 'Error updating contact', error: err.message });
  }
});

app.delete('/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    await contact.destroy();
    res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ message: 'Error deleting contact', error: err.message });
  }
});

// Sync the database and create a super user
sequelize.sync().then(async () => {
  const existingSuperUser = await User.findOne({ where: { username: 'majal' } });
  if (!existingSuperUser) {
    const hashedPassword = await bcrypt.hash('majal1', 10);
    await User.create({
      username: 'majal',
      password: hashedPassword,
      level: 'Super Admin',
      approved: true,
      reason_for_access: 'Initial super user',
    });
    console.log('Super user created');
  }
  
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
