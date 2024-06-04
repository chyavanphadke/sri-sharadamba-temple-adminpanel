const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sequelize, User, Contact } = require('./models');
const { Op } = require('sequelize');

const app = express();
const port = 5001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

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
      approved: false,
      reason_for_access,
    });
    res.status(200).json({ message: 'User signed up successfully. Waiting for Admin approval.' });
  } catch (err) {
    console.error('Error signing up:', err);
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
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

app.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findOne({ where: { username: req.user.username } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Error changing password', error: err.message });
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

app.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

// Contact Management Routes
app.get('/contacts', async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = search
      ? { [Op.or]: [{ first_name: { [Op.like]: `%${search}%` } }, { last_name: { [Op.like]: `%${search}%` } }] }
      : {};

    const contacts = await Contact.findAll({ where: whereClause, order: [['updatedAt', 'DESC']] });
    res.status(200).json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ message: 'Error fetching contacts', error: err.message });
  }
});

app.post('/contacts', async (req, res) => {
  const { email, ...otherFields } = req.body;
  try {
    const existingContact = await Contact.findOne({ where: { email } });
    if (existingContact) {
      return res.status(400).json({ error: 'The email is already registered' });
    }
    const contact = await Contact.create({ email, ...otherFields });
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Error adding contact' });
  }
});

app.put('/contacts/:id', async (req, res) => {
  const { first_name, last_name, phone_number, alternate_phone_number, address, city, state, zip_code, email, gothra, star, dob } = req.body;
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    contact.first_name = first_name;
    contact.last_name = last_name;
    contact.phone_number = phone_number;
    contact.alternate_phone_number = alternate_phone_number;
    contact.address = address;
    contact.city = city;
    contact.state = state;
    contact.zip_code = zip_code;
    contact.email = email;
    contact.gothra = gothra;
    contact.star = star;
    contact.dob = dob;
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
  const existingSuperUser = await User.findOne({ where: { username: 'admin' } });
  if (!existingSuperUser) {
    const hashedPassword = await bcrypt.hash('maya@111', 10);
    await User.create({
      username: 'admin',
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
