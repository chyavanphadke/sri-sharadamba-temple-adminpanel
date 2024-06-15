const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sequelize, User, Devotee, Family, Service, Activity, ModeOfPayment, Receipt } = require('./models');
const { Op } = require('sequelize'); // Make sure this is only declared once

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
    req.user = decodedToken; // Ensure decodedToken contains userid
    next();
  });
};

// Authentication Routes
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or Email already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
      approved: false,
    });
    res.status(200).json({ message: 'User signed up successfully. Waiting for Admin approval.' });
  } catch (err) {
    console.error('Error signing up:', err);
    res.status(500).json({ message: 'Error signing up', error: err.message });
  }
});

// Update Login Route to accept either username or email
app.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });
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
    const token = jwt.sign({ userid: user.userid, username: user.username, usertype: user.usertype }, 'secret_key', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Forgot Password Route to generate and send reset token
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send email with the reset token
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'chyavanphadke95@gmail.com',
        pass: 'dkse hzdh yluv xcvn' // Use App Password here
      }
    });

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: 'chyavanphadke95@gmail.com',
      to: email,
      subject: 'Password Reset for Sharada Temple, Milpitas',
      text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send('Error sending email');
      }
      res.send('Email sent: ' + info.response);
    });

    res.status(200).json({ message: `Reset email sent to ${email}` });
  } catch (err) {
    console.error('Error sending reset email:', err);
    res.status(500).json({ message: 'Error sending reset email', error: err.message });
  }
});

// Reset Password Route
app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { [Op.gt]: Date.now() }
      }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Error resetting password', error: err.message });
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
    user.approvedBy = '9a64e1bd-3fe3-4912-92fa-a8a5d01106e1';
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
      ? { 
          [Op.or]: [
            { FirstName: { [Op.like]: `%${search}%` } },
            { LastName: { [Op.like]: `%${search}%` } },
            { Phone: { [Op.like]: `%${search}%` } },
            { Email: { [Op.like]: `%${search}%` } }
          ]
        }
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

app.get('/devotees/:id/related-count', authenticateToken, async (req, res) => {
  try {
    const devoteeId = req.params.id;
    const activityCount = await Activity.count({ where: { DevoteeId: devoteeId } });
    const familyMemberCount = await Family.count({ where: { DevoteeId: devoteeId } });

    res.status(200).json({ activityCount, familyMemberCount });
  } catch (err) {
    console.error('Error fetching related counts:', err);
    res.status(500).json({ message: 'Error fetching related counts', error: err.message });
  }
});

app.post('/devotees', authenticateToken, async (req, res) => {
  const { FirstName, LastName, Phone, AltPhone, Address, City, State, Zip, Email, Gotra, Star, DOB, family } = req.body;
  const transaction = await sequelize.transaction();
  try {
    const existingDevotee = await Devotee.findOne({ where: { Email } });
    if (existingDevotee) {
      return res.status(400).json({ error: 'The email is already registered' });
    }
    const devotee = await Devotee.create({ FirstName, LastName, Phone, AltPhone, Address, City, State, Zip, Email, Gotra, Star, DOB }, { transaction });
    for (const member of family) {
      await Family.create({ DevoteeId: devotee.DevoteeId, ModifiedBy: req.user.userid, ...member }, { transaction });
    }
    await transaction.commit();
    res.status(201).json(devotee);
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding devotee:', error);
    res.status(500).json({ message: 'Error adding devotee', error: error.message });
  }
});

app.put('/devotees/:id', authenticateToken, async (req, res) => {
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
      await Family.create({ DevoteeId: devotee.DevoteeId, ModifiedBy: req.user.userid, ...member }, { transaction });
    }
    await transaction.commit();
    res.status(200).json({ message: 'Devotee updated successfully' });
  } catch (err) {
    await transaction.rollback();
    console.error('Error updating devotee:', err);
    res.status(500).json({ message: 'Error updating devotee', error: err.message });
  }
});

app.delete('/devotees/:id', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const devotee = await Devotee.findByPk(req.params.id);
    if (!devotee) {
      return res.status(404).json({ message: 'Devotee not found' });
    }
    // Manually delete related records in the Activity table
    await Activity.destroy({ where: { DevoteeId: devotee.DevoteeId }, transaction });
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

// Service Management Routes
app.get('/services', async (req, res) => {
  try {
    const services = await Service.findAll();
    res.status(200).json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Error fetching services', error: err.message });
  }
});

app.put('/services', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const updates = req.body;
    for (const update of updates) {
      const service = await Service.findByPk(update.ServiceId);
      if (service) {
        await service.update(update, { transaction });
      }
    }
    await transaction.commit();
    res.status(200).json({ message: 'Services updated successfully' });
  } catch (err) {
    await transaction.rollback();
    console.error('Error updating services:', err);
    res.status(500).json({ message: 'Error updating services', error: err.message });
  }
});

// Add this endpoint to handle the addition of new services
app.post('/services', async (req, res) => {
  const { Service, Rate, Comment, Active, DisplayFamily, Temple, SvcCategoryId } = req.body;
  try {
    const newService = await Service.create({
      Service,
      Rate,
      Comment: Comment || '',
      Active: Active || true,
      DisplayFamily: DisplayFamily || false,
      Temple: Temple || 0,
      SvcCategoryId: SvcCategoryId || null,
    });
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ message: 'Failed to add service' });
  }
});

// ModeOfPayment Management Routes
app.get('/payment-methods', async (req, res) => {
  try {
    const paymentMethods = await ModeOfPayment.findAll();
    res.status(200).json(paymentMethods);
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    res.status(500).json({ message: 'Error fetching payment methods', error: err.message });
  }
});

// Activity Management Routes
app.post('/activities', async (req, res) => {
  const { DevoteeId, ServiceId, PaymentMethod, Amount, CheckNumber, Comments, UserId, ServiceDate } = req.body;
  console.log('Received request to add activity:', req.body); // Log input values
  try {
    await Activity.create({
      DevoteeId,
      ServiceId,
      PaymentMethod,
      Amount,
      CheckNumber,
      Comments,
      UserId,
      ActivityDate: new Date(),
      ServiceDate
    });
    res.status(201).json({ message: 'Activity added successfully' });
  } catch (error) {
    console.error('Error adding activity:', error); // Log the error
    res.status(500).json({ message: 'Error adding activity', error: error.message });
  }
});

// Updated code for reports page
app.get('/reports', authenticateToken, async (req, res) => {
  const { startDate, endDate, service, excludeDonations, paymentMethod, excludeChecks } = req.query;

  const whereClause = {
    ActivityDate: {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    }
  };

  try {
    if (service && service !== 'null') {
      whereClause.ServiceId = service;
    }

    if (excludeDonations === 'true') {
      const donationService = await Service.findOne({ where: { Service: 'DONATION' } });
      if (donationService) {
        whereClause.ServiceId = { [Op.ne]: donationService.ServiceId };
      }
    }

    if (paymentMethod && paymentMethod !== 'null') {
      whereClause.PaymentMethod = paymentMethod;
    }

    if (excludeChecks === 'true') {
      const checkMethod = await ModeOfPayment.findOne({ where: { MethodName: 'Check' } });
      if (checkMethod) {
        whereClause.PaymentMethod = { [Op.ne]: checkMethod.PaymentMethodId };
      }
    }

    const activities = await Activity.findAll({
      where: whereClause,
      include: [
        { model: Devotee, attributes: ['FirstName', 'LastName', 'Phone'], required: true },
        { model: Service, attributes: ['Service'], required: true },
        { model: ModeOfPayment, attributes: ['MethodName'], required: true }
      ],
      order: [['ActivityDate', 'DESC']]
    });

    const reportData = activities.map(activity => ({
      Name: `${activity.Devotee.FirstName} ${activity.Devotee.LastName}`,
      Phone: activity.Devotee.Phone,
      Service: activity.Service.Service,
      Amount: activity.Amount,
      Date: activity.ActivityDate,
      ServiceDate: activity.ServiceDate,
      'Payment Method': activity.ModeOfPayment.MethodName,
      'Check Number': activity.CheckNumber
    }));

    res.status(207).json(reportData);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ message: 'Error fetching reports', error: err.message });
  }
});
// End of updated code for reports page

// Endpoint to get activities for the calendar
app.get('/calendar/activities', async (req, res) => {
  try {
    const activities = await Activity.findAll({
      where: {
        PrintDate: {
          [Op.is]: null,
        },
      },
      include: [
        { model: Devotee, attributes: ['FirstName', 'LastName', 'Email', 'Phone', 'DevoteeId'] },
        { model: Service, attributes: ['Service'] },
      ],
    });

    // Transform the data to the required format
    const result = await Promise.all(activities.map(async activity => {
      const familyMembers = await Family.findAll({
        where: { DevoteeId: activity.Devotee.DevoteeId },
        attributes: ['FirstName', 'LastName'],
      });
      return {
        ActivityId: activity.ActivityId,
        ServiceDate: activity.ServiceDate,
        EventName: activity.Service.Service,
        DevoteeName: `${activity.Devotee.FirstName} ${activity.Devotee.LastName}`,
        DevoteeEmail: activity.Devotee.Email,
        DevoteePhone: activity.Devotee.Phone,
        FamilyMembers: familyMembers.map(member => `${member.FirstName} ${member.LastName}`),
      };
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching activities for calendar:', err);
    res.status(500).json({ message: 'Error fetching activities for calendar', error: err.message });
  }
});

app.put('/calendar/activities/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    activity.PrintDate = new Date();
    await activity.save();

    res.status(200).json({ message: 'Activity marked as complete' });
  } catch (err) {
    console.error('Error marking activity as complete:', err);
    res.status(500).json({ message: 'Error marking activity as complete', error: err.message });
  }
});

// Endpoint to get activities in a date range with null PrintDate
app.get('/calendar/activities/range', async (req, res) => {
  const { from, to } = req.query;
  try {
    const activities = await Activity.findAll({
      where: {
        ServiceDate: {
          [Op.between]: [new Date(from), new Date(to)]
        },
        PrintDate: {
          [Op.is]: null
        },
      },
      include: [
        { model: Devotee, attributes: ['FirstName', 'LastName', 'Email', 'Phone', 'DevoteeId'] },
        { model: Service, attributes: ['Service'] },
      ],
    });

    const result = await Promise.all(activities.map(async activity => {
      const familyMembers = await Family.findAll({
        where: { DevoteeId: activity.Devotee.DevoteeId },
        attributes: ['FirstName', 'LastName'],
      });
      return {
        ActivityId: activity.ActivityId,
        ServiceDate: activity.ServiceDate,
        EventName: activity.Service.Service,
        DevoteeName: `${activity.Devotee.FirstName} ${activity.Devotee.LastName}`,
        DevoteeEmail: activity.Devotee.Email,
        DevoteePhone: activity.Devotee.Phone,
        FamilyMembers: familyMembers.map(member => `${member.FirstName} ${member.LastName}`),
      };
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching activities for calendar:', err);
    res.status(500).json({ message: 'Error fetching activities for calendar', error: err.message });
  }
});

// Endpoint to get activities with past ServiceDate and null PrintDate
app.get('/calendar/activities/past', async (req, res) => {
  try {
    const activities = await Activity.findAll({
      where: {
        ServiceDate: {
          [Op.lt]: new Date()
        },
        PrintDate: {
          [Op.is]: null
        },
      },
      include: [
        { model: Devotee, attributes: ['FirstName', 'LastName', 'Email', 'Phone', 'DevoteeId'] },
        { model: Service, attributes: ['Service'] },
      ],
    });

    const result = await Promise.all(activities.map(async activity => {
      const familyMembers = await Family.findAll({
        where: { DevoteeId: activity.Devotee.DevoteeId },
        attributes: ['FirstName', 'LastName'],
      });
      return {
        ActivityId: activity.ActivityId,
        ServiceDate: activity.ServiceDate,
        EventName: activity.Service.Service,
        DevoteeName: `${activity.Devotee.FirstName} ${activity.Devotee.LastName}`,
        DevoteeEmail: activity.Devotee.Email,
        DevoteePhone: activity.Devotee.Phone,
        FamilyMembers: familyMembers.map(member => `${member.FirstName} ${member.LastName}`),
      };
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching past activities for calendar:', err);
    res.status(500).json({ message: 'Error fetching past activities for calendar', error: err.message });
  }
});

// Endpoint to get services and their upcoming event count
app.get('/services/upcoming-count', async (req, res) => {
  try {
    const services = await Service.findAll({
      attributes: ['ServiceId', 'Service']
    });

    const upcomingEvents = await Activity.findAll({
      where: {
        ServiceDate: {
          [Op.between]: [moment().add(1, 'day').toDate(), moment().add(15, 'days').toDate()]
        },
        PrintDate: {
          [Op.is]: null
        }
      },
      attributes: ['ServiceId', [sequelize.fn('COUNT', sequelize.col('ServiceId')), 'count']],
      group: ['ServiceId']
    });

    const serviceCountMap = {};
    upcomingEvents.forEach(event => {
      serviceCountMap[event.ServiceId] = event.dataValues.count;
    });

    const result = services.map(service => ({
      ServiceId: service.ServiceId,
      Service: service.Service,
      Count: serviceCountMap[service.ServiceId] || 0
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching services and upcoming counts:', err);
    res.status(500).json({ message: 'Error fetching services and upcoming counts', error: err.message });
  }
});

// Fetch pending receipts
app.get('/receipts/pending', async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = {
      '$Receipt.activityid$': { [Op.is]: null },
      PrintDate: { [Op.is]: null }
    };

    if (search) {
      whereClause[Op.or] = [
        { '$Devotee.FirstName$': { [Op.like]: `%${search}%` } },
        { '$Devotee.LastName$': { [Op.like]: `%${search}%` } },
        { '$Devotee.Phone$': { [Op.like]: `%${search}%` } },
        { '$Devotee.Email$': { [Op.like]: `%${search}%` } }
      ];
    }

    const activities = await Activity.findAll({
      where: whereClause,
      include: [
        { model: Devotee, attributes: ['FirstName', 'LastName'] },
        { model: Service, attributes: ['Service'] },
        { model: User, as: 'AssistedBy', attributes: ['username'] },
        { model: Receipt, attributes: [] }
      ],
      raw: true,
      nest: true,
      order: [['ActivityDate', 'DESC']]
    });

    const pendingReceipts = activities.map(activity => ({
      ActivityId: activity.ActivityId,
      Name: `${activity.Devotee.FirstName} ${activity.Devotee.LastName}`,
      Service: activity.Service.Service,
      Date: activity.ActivityDate,
      CheckNumber: activity.CheckNumber,
      Amount: activity.Amount,
      AssistedBy: activity.AssistedBy.username,
      PaymentMethod: activity.PaymentMethod
    }));

    res.status(200).json(pendingReceipts);
  } catch (err) {
    console.error('Error fetching pending receipts:', err);
    res.status(500).json({ message: 'Error fetching pending receipts', error: err.message });
  }
});

// Fetch approved receipts
app.get('/receipts/approved', async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = search
      ? {
          [Op.or]: [
            { '$Activity.Devotee.FirstName$': { [Op.like]: `%${search}%` } },
            { '$Activity.Devotee.LastName$': { [Op.like]: `%${search}%` } },
            { '$Activity.Devotee.Phone$': { [Op.like]: `%${search}%` } },
            { '$Activity.Devotee.Email$': { [Op.like]: `%{search}%` } }
          ]
        }
      : {};

    const receipts = await Receipt.findAll({
      where: whereClause,
      include: [
        {
          model: Activity,
          include: [
            { model: Devotee, attributes: ['FirstName', 'LastName', 'Email'] },
            { model: Service, attributes: ['Service'] },
            { model: User, as: 'AssistedBy', attributes: ['username'] }
          ]
        }
      ],
      order: [['approvaldate', 'DESC']]
    });

    const approvedReceipts = receipts.map(receipt => ({
      ReceiptId: receipt.receiptid,
      Name: `${receipt.Activity.Devotee.FirstName} ${receipt.Activity.Devotee.LastName}`,
      Email: receipt.Activity.Devotee.Email,
      Service: receipt.servicetype,
      ActivityDate: receipt.Activity.ActivityDate,
      ApprovedDate: receipt.approvaldate,
      CheckNumber: receipt.Activity.CheckNumber,
      Amount: receipt.Activity.Amount,
      AssistedBy: receipt.Activity.AssistedBy.username,
      PaymentMethod: receipt.Activity.PaymentMethod
    }));

    res.status(200).json(approvedReceipts);
  } catch (err) {
    console.error('Error fetching approved receipts:', err);
    res.status(500).json({ message: 'Error fetching approved receipts', error: err.message });
  }
});

// Fetch payment method by ID
app.get('/payment-method/:id', async (req, res) => {
  try {
    const paymentMethod = await ModeOfPayment.findByPk(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    res.status(200).json(paymentMethod);
  } catch (err) {
    console.error('Error fetching payment method:', err);
    res.status(500).json({ message: 'Error fetching payment method', error: err.message });
  }
});


app.post('/receipts/approve', authenticateToken, async (req, res) => {
  const { activityId } = req.body;
  try {
    const activity = await Activity.findByPk(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const service = await Service.findByPk(activity.ServiceId);
    const user = await User.findByPk(req.user.userid);

    await Receipt.create({
      servicetype: service.Service,
      activityid: activity.ActivityId,
      approvedby: user.username,
      approvaldate: new Date(),
    });

    res.status(200).json({ message: 'Receipt approved successfully' });
  } catch (err) {
    console.error('Error approving receipt:', err);
    res.status(500).json({ message: 'Error approving receipt', error: err.message });
  }
});

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/send-receipt-email', upload.single('pdf'), (req, res) => {
  const email = req.body.email;
  const pdfBuffer = req.file.buffer;
  const pdfName = req.file.originalname;

  const { Name, ActivityDate } = req.body;

  // Configure nodemailer transport
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'chyavanphadke95@gmail.com',
      pass: 'dkse hzdh yluv xcvn' // Use App Password here
    }
  });

  const mailOptions = {
    from: 'chyavanphadke95@gmail.com',
    to: email,
    subject: `Your Receipt for Donation at Sharada SEVA, Date ${ActivityDate}`,
    text: `Dear ${Name},

Thank you very much for your generous donation to the Sringeri Education and Vedic Academy.

If you wish, you can match this donation through Benevity under the name "Sringeri Education and Vedic Academy Inc."

Sincerely,
Sringeri Education and Vedic Academy.`,
    attachments: [
      {
        filename: pdfName,
        content: pdfBuffer
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error sending email');
    }
    res.send('Email sent: ' + info.response);
  });
});

app.put('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    const updatedData = req.body;
    await activity.update(updatedData);
    res.status(200).json({ message: 'Activity updated successfully' });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Error updating activity', error: error.message });
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
