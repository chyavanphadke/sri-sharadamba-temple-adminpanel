const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sequelize, User, Devotee, Family } = require('./models');
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

  jwt.verify(token, 'secret_key', (err, decodedToken) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.sendStatus(403);
    }
    req.user = decodedToken; // Assuming your user object in the token has a 'userid' property
    next();
  });
};

// Authentication Routes sign up
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
    const token = jwt.sign({ username, usertype: user.usertype }, 'secret_key', { expiresIn: '1h' });
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
app.get('/user', async (req, res) => {
  try {
    const user = await User.findAll();
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
});

app.put('/user/:userid/approve', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.approved = true;
    user.active = true;
    user.approvedBy = '9a64e1bd-3fe3-4912-92fa-a8a5d01106e1'
    await user.save();
    res.status(200).json({ message: 'User approved successfully' });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ message: 'Error approving user', error: err.message });
  }
});

app.put('/user/:userid/usertype', async (req, res) => {
  const { usertype } = req.body;
  try {
    const user = await User.findByPk(req.params.userid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.usertype = usertype;
    await user.save();
    res.status(200).json({ message: 'User usertype updated successfully' });
  } catch (err) {
    console.error('Error updating user usertype:', err);
    res.status(500).json({ message: 'Error updating user usertype', error: err.message });
  }
});

app.delete('/user/:userid', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userid);
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

// Devotee Management Routes
app.get('/devotees', async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = search
      ? { [Op.or]: [{ FirstName: { [Op.like]: `%${search}%` } }, { LastName: { [Op.like]: `%${search}%` } }] }
      : {};

    const devotees = await Devotee.findAll({ where: whereClause, order: [['LastModified', 'DESC']] });
    res.status(200).json(devotees);
  } catch (err) {
    console.error('Error fetching devotees:', err);
    res.status(500).json({ message: 'Error fetching devotees', error: err.message });
  }
});

app.get('/devotees/:id/family', async (req, res) => {
  try {
    const families = await Family.findAll({ where: { DevoteeId: req.params.id }, order: [['LastModified', 'DESC']] });
    res.status(200).json(families);
  } catch (err) {
    console.error('Error fetching family members:', err);
    res.status(500).json({ message: 'Error fetching family members', error: err.message });
  }
});

app.post('/devotees', async (req, res) => {
  const { FirstName, LastName, Phone, AltPhone, Address, City, State, Zip, Email, Gotra, Star, DOB, family } = req.body;
  const transaction = await sequelize.transaction();
  try {
    const existingDevotee = await Devotee.findOne({ where: { Email } });
    if (existingDevotee) {
      return res.status(400).json({ error: 'The email is already registered' });
    }
    const devotee = await Devotee.create({ FirstName, LastName, Phone, AltPhone, Address, City, State, Zip, Email, Gotra, Star, DOB }, { transaction });
    for (const member of family) {
      await Family.create({ DevoteeId: devotee.DevoteeId, ...member }, { transaction });
    }
    await transaction.commit();
    res.status(201).json(devotee);
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding devotee:', error);
    res.status(500).json({ message: 'Error adding devotee', error: error.message });
  }
});

app.put('/devotees/:id', async (req, res) => {
  const { FirstName, LastName, Phone, AltPhone, Address, City, State, Zip, Email, Gotra, Star, DOB, family } = req.body;
  const transaction = await sequelize.transaction();
  try {
    const devotee = await Devotee.findByPk(req.params.id);
    if (!devotee) {
      return res.status(404).json({ message: 'Devotee not found' });
    }
    await devotee.update({ FirstName, LastName, Phone, AltPhone, Address, City, State, Zip, Email, Gotra, Star, DOB }, { transaction });
    await Family.destroy({ where: { DevoteeId: devotee.DevoteeId }, transaction });
    for (const member of family) {
      await Family.create({ DevoteeId: devotee.DevoteeId, ...member }, { transaction });
    }
    await transaction.commit();
    res.status(200).json({ message: 'Devotee updated successfully' });
  } catch (err) {
    await transaction.rollback();
    console.error('Error updating devotee:', err);
    res.status(500).json({ message: 'Error updating devotee', error: err.message });
  }
});

app.delete('/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    await Family.destroy({ where: { DevoteeId: devotee.DevoteeId }, transaction });
    await devotee.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: 'Devotee deleted successfully' });
  } catch (err) {
    await transaction.rollback();
    console.error('Error deleting devotee:', err);
    res.status(500).json({ message: 'Error deleting devotee', error: err.message });
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
      usertype: 'Super Admin',
      approved: true,
      approvedBy: 0,
      active: true,
      super_user: true,
      reason_for_access: 'Initial super user',
    });
    console.log('Super user created');
  }
  
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
