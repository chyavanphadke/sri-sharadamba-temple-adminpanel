const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, User, Devotee, Family, Service, ServiceCategory, Activity, ModeOfPayment, Receipt, AccessControl, EmailCredential, GeneralConfigurations, EditedReceipts, ExcelSevaData, EmailLog} = require('./models');
const moment = require('moment');
const { Op, Sequelize } = require('sequelize'); // Make sure this is only declared once
const { JSDOM } = require("jsdom");
const ngrok = require('ngrok');

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

// Email error reporting function
async function reportError(error, context = {}) {
  try {
    // Check if error reporting is enabled
    const config = await GeneralConfigurations.findOne({ where: { configuration: 'errorreport' } });
    if (!config || config.value !== '1') {
      console.log('Error reporting is disabled.');
      return;
    }

    // Fetch email credentials
    const emailCredential = await EmailCredential.findOne();
    if (!emailCredential) {
      console.error('Email credentials not found');
      return;
    }

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: emailCredential.email,
        pass: emailCredential.appPassword
      }
    });

    // Calculate the current date and time in PST
    const currentTimeUTC = moment().utc();
    const currentTimePST = currentTimeUTC.subtract(7, 'hours'); // PST is UTC-7 during daylight saving time

    // Format the time for the subject line
    const formattedTimePST = currentTimePST.format('MMMM Do [at] h:mm A');

    // Collect detailed error information
    const errorDetails = `
      An error occurred:
      - Message: ${error.message}
      - Stack trace: ${error.stack}
      - Time: ${formattedTimePST}
      - Function/Endpoint: ${context.endpoint || 'Unknown'}
      - Request Parameters: ${JSON.stringify(context.params || {})}
      - Additional Info: ${context.info || 'None'}
    `;

    // Define mail options
    const mailOptions = {
      from: emailCredential.email,
      to: ['chyavanphadke@gmail.com', 'yadavmm.30@gmail.com'],
      subject: `Error Reported at ${formattedTimePST}`,
      text: errorDetails
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending error report email:', err);
      } else {
        console.log('Error report email sent:', info.response);
      }
    });
  } catch (err) {
    console.error('Error reporting the original error:', err);
  }
}

// Fetch all users with their details
app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['userid', 'username']
    });
    res.status(200).json(users);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// Fetch user by userid
app.get('/user/:userid', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userid, {
      attributes: ['username']
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
});

// Authentication Routes
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username }, 
          { email }
        ] 
      } 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or Email already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const config = await GeneralConfigurations.findOne({ where: { configuration: 'autoApprove' } });

    const newUser = {
      username,
      email,
      password: hashedPassword,
      approved: config && config.value === '1' ? true : false,
      approvedBy: config && config.value === '1' ? 'Auto Approved' : null,
    };

    await User.create(newUser);

    const message = config && config.value === '1'
      ? 'User signed up successfully. Auto Approved.'
      : 'User signed up successfully. Waiting for Admin approval.';

    res.status(200).json({ message });
  } catch (err) {
    await reportError(err);
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
    await reportError(err);
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Helper function to generate random OTP of length 10
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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
    await reportError(err);
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const now = Date.now();
    let otp;
    if (user.passwordResetToken && user.passwordResetExpires > now) {
      otp = user.passwordResetToken; // Reuse the existing OTP
    } else {
      otp = generateOtp();
      user.passwordResetToken = otp;
      user.passwordResetExpires = now + 3 * 60 * 1000; // Token expires in 3 minutes
      await user.save();
    }

    const emailCredential = await EmailCredential.findOne();
    if (!emailCredential) {
      return res.status(404).json({ message: 'Email credentials not found' });
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: emailCredential.email,
        pass: emailCredential.appPassword
      }
    });

    const mailOptions = {
      from: emailCredential.email,
      to: email,
      subject: 'Password Reset OTP for Sharada Temple, Milpitas',
      text: `You requested a password reset. Your OTP is: ${otp}. This OTP is valid for 3 minutes.`
    };

    // Step 5: Send email
    try {
      const info = await transporter.sendMail(mailOptions);

      // Log email activity
      await EmailLog.create({
        status: 'Sent',
        name: user.username || 'Unknown',
        email,
        message: 'Password reset OTP',
        module: 'Login',
      });

      return res.status(200).json({ message: `OTP sent to ${email}` });
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);

      // Log email failure
      await EmailLog.create({
        status: 'Error',
        name: user.username || 'Unknown',
        email,
        message: 'Password reset OTP',
        module: 'Login',
      });

      return res.status(500).json({ message: 'Error sending OTP email', error: emailError.message });
    }
  } catch (err) {
    console.error('Unexpected error:', err);

    // Log the unexpected error
    await EmailLog.create({
      status: 'Error',
      name: null,
      email,
      message: `Unexpected error: ${err.message}`,
      module: 'Login',
    });

    return res.status(500).json({ message: 'An unexpected error occurred', error: err.message });
  }
});

app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({
      where: {
        email,
        passwordResetToken: otp,
        passwordResetExpires: { [Op.gt]: Date.now() }
      }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    await reportError(err);
    console.error('Error verifying OTP:', err);
    res.status(500).json({ message: 'Error verifying OTP', error: err.message });
  }
});

app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({
      where: {
        email,
        passwordResetToken: otp,
        passwordResetExpires: { [Op.gt]: Date.now() }
      }
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    await reportError(err);
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Error resetting password', error: err.message });
  }
});

app.post('/invalidate-token', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (user) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
    }
    res.status(200).json({ message: 'Token invalidated' });
  } catch (err) {
    await reportError(err);
    console.error('Error invalidating token:', err);
    res.status(500).json({ message: 'Error invalidating token', error: err.message });
  }
});

// User Management Routes
app.get('/user', async (req, res) => {
  try {
    const user = await User.findAll();
    res.status(200).json(user);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
});

app.put('/user/:userid/approve', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const approver = await User.findByPk(req.user.userid); // Fetch the approver's details using the authenticated user's ID
    if (!approver) {
      return res.status(404).json({ message: 'Approver not found' });
    }

    user.approved = true;
    user.active = true;
    user.approvedBy = approver.userid; // Set approvedBy to the approver's username
    await user.save();

    res.status(200).json({ message: 'User approved successfully' });
  } catch (err) {
    await reportError(err);
    console.error('Error approving user:', err);
    res.status(500).json({ message: 'Error approving user', error: err.message });
  }
});

app.put('/user/:userid/disapprove', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.approved = false;
    user.active = false;
    user.approvedBy = null; // Clear the approvedBy field or set it to a default value
    await user.save();

    res.status(200).json({ message: 'User disapproved successfully' });
  } catch (err) {
    await reportError(err);
    console.error('Error disapproving user:', err);
    res.status(500).json({ message: 'Error disapproving user', error: err.message });
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
    await reportError(err);
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
    await reportError(err);
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
});

// Endpoint to get activities for a specific devotee with PrintDate as null
app.get('/devotees/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { printDateNull } = req.query;

    const whereClause = {
      DevoteeId: id,
    };

    if (printDateNull === 'true') {
      whereClause.PrintDate = {
        [Op.is]: null
      };
    }

    const activities = await Activity.findAll({
      where: whereClause,
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
    await reportError(err);
    console.error('Error fetching activities for devotee:', err);
    res.status(500).json({ message: 'Error fetching activities for devotee', error: err.message });
  }
});

app.put('/calendar/activities/:id', async (req, res) => {
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
    await reportError(error);
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Error updating activity', error: error.message });
  }
});

// Add this endpoint to handle today's activities
app.get('/calendar/activities/today', async (req, res) => {
  try {
    const today = moment().utc().startOf('day').toDate();
    const activities = await Activity.findAll({
      where: {
        ServiceDate: {
          [Op.eq]: today
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
    await reportError(err);
    console.error('Error fetching today\'s activities:', err);
    res.status(500).json({ message: 'Error fetching today\'s activities', error: err.message });
  }
});

// Devotee Management Routes
app.get('/devotees', async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = search
      ? {
        [Op.or]: [
          { DevoteeId: { [Op.like]: `%${search}%` } },
          { FirstName: { [Op.like]: `%${search}%` } },
          { LastName: { [Op.like]: `%${search}%` } },
          { Phone: { [Op.like]: `%${search}%` } },
          { Email: { [Op.like]: `%${search}%` } },
          sequelize.literal(`EXISTS (SELECT 1 FROM family WHERE family.DevoteeId = devotee.DevoteeId AND (family.FirstName LIKE '%${search}%' OR family.LastName LIKE '%${search}%'))`)
        ]
      }
      : {};

    const devotees = await Devotee.findAll({
      where: whereClause,
      include: [
        {
          model: Family,
          attributes: ['FirstName', 'LastName'],
          required: false // Include family members if they exist, but don't require them for the devotee to be included
        }
      ],
      order: [['LastModified', 'DESC']]
    });

    res.status(200).json(devotees);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching devotees:', err);
    res.status(500).json({ message: 'Error fetching devotees', error: err.message });
  }
});

app.get('/devotees/:id/family', async (req, res) => {
  try {
    const families = await Family.findAll({ where: { DevoteeId: req.params.id }, order: [['LastModified', 'DESC']] });
    res.status(200).json(families);
  } catch (err) {
    await reportError(err);
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
    await reportError(err);
    console.error('Error fetching related counts:', err);
    res.status(500).json({ message: 'Error fetching related counts', error: err.message });
  }
});

app.post('/devotees', authenticateToken, async (req, res) => {
  const { FirstName, LastName, Phone, AltPhone, Address, City, State, Zip, Email, Gotra, Star, DOB, family } = req.body;
  const transaction = await sequelize.transaction();
  try {
    // Check for existing email if Email is not null or empty
    if (Email) {
      const existingDevoteeWithEmail = await Devotee.findOne({ where: { Email } });
      if (existingDevoteeWithEmail) {
        return res.status(400).json({ error: 'The email is already registered' });
      }
    }

    // Check for existing phone if Phone is not null or empty
    if (Phone) {
      const existingDevoteeWithPhone = await Devotee.findOne({ where: { Phone } });
      if (existingDevoteeWithPhone) {
        return res.status(400).json({ error: 'The phone number is already registered' });
      }
    }

    const devotee = await Devotee.create({
      FirstName,
      LastName,
      Phone: Phone || null,
      AltPhone: AltPhone || null,
      Address: Address || null,
      City: City || null,
      State: State || null,
      Zip: Zip || null,
      Email: Email || null,
      Gotra: Gotra || null,
      Star: Star || null,
      DOB: DOB || null
    }, { transaction });

    for (const member of family) {
      await Family.create({ DevoteeId: devotee.DevoteeId, ModifiedBy: req.user.userid, ...member }, { transaction });
    }

    await transaction.commit();
    res.status(201).json(devotee);
  } catch (error) {
    await reportError(error);
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
    await reportError(err);
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
    await reportError(err);
    await transaction.rollback();
    console.error('Error deleting devotee:', err);
    res.status(500).json({ message: 'Error deleting devotee', error: err.message });
  }
});

app.get('/active-servicecategories', async (req, res) => {
  try {
    console.log('Fetching active service categories...');
    const categories = await ServiceCategory.findAll({ where: { active: 1 } });
    //console.log('Active categories fetched:', categories);
    res.status(200).json(categories);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching active categories:', err.message, err.stack);
    res.status(500).json({ message: 'Error fetching active categories', error: err.message });
  }
});

app.get('/servicecategoriesStat', async (req, res) => {
  try {
    const categories = await ServiceCategory.findAll({ where: { active: 1 } });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

app.get('/servicesStat', async (req, res) => {
  const { categoryId } = req.query;
  try {
    const services = await Service.findAll({ where: { category_id: categoryId, Active: 1 } });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.get('/activitiesStat', async (req, res) => {
  const { serviceId, from, to } = req.query;
  try {
    const activities = await Activity.findAll({
      where: { ServiceId: serviceId, ServiceDate: { [Op.between]: [from, to] } },
      include: [{ model: Devotee, attributes: ['FirstName', 'LastName'] }],
    });
    res.json(
      activities.map((act) => ({
        DevoteeName: `${act.Devotee.FirstName} ${act.Devotee.LastName}`,
        ServiceDate: act.ServiceDate,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.get('/services-by-category', async (req, res) => {
  try {
    const { categoryId } = req.query;
    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    //console.log(`Fetching services for category ID: ${categoryId}...`);
    const services = await Service.findAll({ where: { category_id: categoryId, Active: 1 } });
    //console.log('Services fetched:', services);
    res.status(200).json(services);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching services by category:', err.message, err.stack);
    res.status(500).json({ message: 'Error fetching services by category', error: err.message });
  }
});

// Service Management Routes

app.get('/services', async (req, res) => {
  try {
    const services = await Service.findAll();
    res.status(200).json(services);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Error fetching services', error: err.message });
  }
});

app.post('/services', async (req, res) => {
  const { Service: serviceName, Rate, Comments, Active, DisplayFamily, Temple, category_id, time } = req.body;
  try {
    const newService = await Service.create({ 
      Service: serviceName, 
      Rate, 
      Comments, 
      Active, 
      DisplayFamily, 
      Temple, 
      category_id, 
      time
    });
    res.status(201).json(newService);
  } catch (err) {
    await reportError(err);
    console.error('Error creating service:', err);
    res.status(500).json({ message: 'Error creating service', error: err.message });
  }
});

app.put('/services', async (req, res) => {
  const updatedServices = req.body;
  const transaction = await sequelize.transaction();
  try {
    for (const service of updatedServices) {
      await Service.update(
        { ...service },
        { where: { ServiceId: service.ServiceId } },
        { transaction }
      );
    }
    await transaction.commit();
    res.status(200).json({ message: 'Services updated successfully' });
  } catch (error) {
    await reportError(error);
    await transaction.rollback();
    console.error('Error updating services:', error);
    res.status(500).json({ message: 'Error updating services', error: error.message });
  }
});

app.get('/categories', async (req, res) => {
  try {
    console.log('Fetching categories from database...');
    const categories = await ServiceCategory.findAll();
    //console.log('Categories fetched:', categories);
    res.status(200).json(categories);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching categories:', err.message, err.stack);
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
});

// Update an existing category including excelSheetLink
app.put('/categories/:category_id', async (req, res) => {
  const { category_id } = req.params;
  const { Category_name, Active, excelSheetLink } = req.body;

  try {
    const category = await ServiceCategory.findByPk(category_id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.Category_name = Category_name;
    category.Active = Active;
    category.excelSheetLink = excelSheetLink;

    await category.save();
    res.status(200).json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category' });
  }
});


app.post('/categories', async (req, res) => {
  const { Category_name, Active } = req.body;
  try {
    const newCategory = await ServiceCategory.create({ Category_name, Active });
    res.status(201).json(newCategory);
  } catch (err) {
    await reportError(err);
    console.error('Error creating category:', err);
    res.status(500).json({ message: 'Error creating category', error: err.message });
  }
});

app.put('/categories/:id', async (req, res) => {
  const { Category_name, Active } = req.body;
  try {
    const category = await ServiceCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update category
    await category.update({ Category_name, Active });

    // If the category is deactivated, deactivate all services under it
    if (!Active) {
      await Service.update(
        { Active: false },
        { where: { category_id: req.params.id } }
      );
    } else {
      // If the category is reactivated, reactivate all services under it
      await Service.update(
        { Active: true },
        { where: { category_id: req.params.id } }
      );
    }

    res.status(200).json(category);
  } catch (err) {
    await reportError(err);
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Error updating category', error: err.message });
  }
});

app.delete('/categories/:id', async (req, res) => {
  try {
    const category = await ServiceCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await category.destroy();
    res.status(204).json({ message: 'Category deleted successfully' });
  } catch (err) {
    await reportError(err);
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Error deleting category', error: err.message });
  }
});

// ModeOfPayment Management Routes
app.get('/payment-methods', async (req, res) => {
  try {
    const paymentMethods = await ModeOfPayment.findAll();
    res.status(200).json(paymentMethods);
  } catch (err) {
    await reportError(err);
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
    await reportError(error);
    console.error('Error adding activity:', error); // Log the error
    res.status(500).json({ message: 'Error adding activity', error: error.message });
  }
});

// Get all activities
app.get('/activities', async (req, res) => {
  try {
    const activities = await Activity.findAll();
    res.json(activities);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching activities:', error);
    res.status(500).send('Failed to fetch activities');
  }
});

// Get all devotees
app.get('/devotees', async (req, res) => {
  try {
    const devotees = await Devotee.findAll();
    res.json(devotees);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching devotees:', error);
    res.status(500).send('Failed to fetch devotees');
  }
});

// Get all services
app.get('/services', async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching services:', error);
    res.status(500).send('Failed to fetch services');
  }
});

app.delete('/activities/:id', async (req, res) => {
  try {
    const activityId = req.params.id;
    const activity = await Activity.findByPk(activityId);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    await activity.destroy();
    res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    await reportError(error);
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get top 10 contributions within a date range and price range
app.get('/statistics', async (req, res) => {
  const { from, to, minAmount, maxAmount } = req.query;
  try {
    const results = await Activity.findAll({
      attributes: [
        'DevoteeId',
        [sequelize.fn('SUM', sequelize.col('Amount')), 'TotalAmount'],
        [sequelize.col('Devotee.DevoteeId'), 'Devotee.DevoteeId'],
        [sequelize.col('Devotee.FirstName'), 'Devotee.FirstName'],
        [sequelize.col('Devotee.LastName'), 'Devotee.LastName'],
      ],
      include: [
        {
          model: Devotee,
          attributes: [],
        },
      ],
      where: {
        ActivityDate: {
          [Op.between]: [new Date(from), new Date(new Date(to).setHours(23, 59, 59, 999))],
        },
        Amount: {
          [Op.between]: [minAmount, maxAmount],
        },
      },
      group: ['DevoteeId'],
      order: [[sequelize.fn('SUM', sequelize.col('Amount')), 'DESC']],
      limit: 10,
      raw: true,
    });

    const data = results.map((item) => ({
      DevoteeId: item['Devotee.DevoteeId'],
      DevoteeName: `${item['Devotee.FirstName']} ${item['Devotee.LastName']}`,
      TotalAmount: item.TotalAmount,
    }));

    res.status(200).json(data);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching statistics:', err);
    res.status(500).json({ message: 'Error fetching statistics', error: err.message });
  }
});

// Endpoint to get the maximum Total Contribution value for a selected date range
app.get('/statistics/max-contribution', async (req, res) => {
  const { from, to } = req.query;
  try {
    const result = await Activity.findOne({
      attributes: [[sequelize.fn('MAX', sequelize.col('Amount')), 'maxAmount']],
      where: {
        ActivityDate: {
          [Op.between]: [new Date(from), new Date(new Date(to).setHours(23, 59, 59, 999))],
        },
      },
      raw: true,
    });
    res.status(200).json(result.maxAmount);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching max contribution:', err);
    res.status(500).json({ message: 'Error fetching max contribution', error: err.message });
  }
});

// Add this endpoint to fetch the most done services within a date range
app.get('/statistics/most-done-services', async (req, res) => {
  const { from, to } = req.query;

  try {
    const mostDoneServices = await Activity.findAll({
      where: {
        ServiceDate: {
          [Op.between]: [new Date(from), new Date(to)],
        },
      },
      attributes: [
        'ServiceId',
        [sequelize.fn('COUNT', sequelize.col('Activity.ServiceId')), 'serviceCount'],
      ],
      group: ['ServiceId'],
      order: [[sequelize.fn('COUNT', sequelize.col('Activity.ServiceId')), 'DESC']],
      limit: 10,
      include: [
        {
          model: Service,
          attributes: ['Service'],
        },
      ],
    });

    const formattedData = mostDoneServices.map((service) => ({
      Service: service.Service.Service,
      Count: service.dataValues.serviceCount,
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching most done services:', error);
    res.status(500).json({ message: 'Error fetching most done services', error: error.message });
  }
});

// Route to insert into EditedReceipts
app.post('/edited-receipts', async (req, res) => {
  const { ActivityId, Name, OldService, NewService, OldAmount, NewAmount, EditedBy, Status } = req.body;
  try {
    const newEdit = await EditedReceipts.create({
      ActivityId,
      Name,
      OldService,
      NewService,
      OldAmount,
      NewAmount,
      EditedBy,
      Status: Status || 'Edited', // Default status to 'Edited' if not provided
      EditedOn: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    });
    res.status(201).json(newEdit);
  } catch (error) {
    await reportError(error);
    console.error('Error creating edited receipt:', error);
    res.status(500).json({ error: 'Failed to create edited receipt' });
  }
});

app.get('/edited-receipts', async (req, res) => {
  try {
    const editedReceipts = await EditedReceipts.findAll({
      order: [['EditedOn', 'DESC']]
    });

    res.status(200).json(editedReceipts);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching edited receipts:', err);
    res.status(500).json({ message: 'Error fetching edited receipts', error: err.message });
  }
});

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
    await reportError(err);
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
    await reportError(err);
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
        { 
          model: Devotee, 
          attributes: ['FirstName', 'LastName', 'Email', 'Phone', 'DevoteeId', 'Gotra', 'Star'] 
        },
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
        Gotra: activity.Devotee.Gotra,
        Star: activity.Devotee.Star,
        FamilyMembers: familyMembers.map(member => `${member.FirstName} ${member.LastName}`),
      };
    }));

    res.status(200).json(result);
  } catch (err) {
    await reportError(err);
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
    await reportError(err);
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
    await reportError(err);
    console.error('Error fetching services and upcoming counts:', err);
    res.status(500).json({ message: 'Error fetching services and upcoming counts', error: err.message });
  }
});

// Fetch pending receipts
app.get('/receipts/pending', async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = {
      '$Receipt.activityid$': { [Op.is]: null }
    };

    if (search) {
      whereClause[Op.or] = [
        { ActivityId: { [Op.like]: `%${search}%` } }, // Add search by ActivityId
        { '$Devotee.DevoteeId$': { [Op.like]: `%${search}%` } },
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
        { model: ModeOfPayment, attributes: ['MethodName'] }, // Include ModeOfPayment to get MethodName
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
      ServiceDate: activity.ServiceDate,
      PaymentMethod: activity.ModeOfPayment.MethodName === 'Check' ? `Check (${activity.CheckNumber})` : activity.ModeOfPayment.MethodName,
      Amount: activity.Amount,
      AssistedBy: activity.AssistedBy.username,
    }));

    res.status(200).json(pendingReceipts);
  } catch (err) {
    await reportError(err);
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
            { '$Activity.ActivityId$': { [Op.like]: `%${search}%` } },
            { '$Activity.Devotee.DevoteeId$': { [Op.like]: `%${search}%` } },
            { '$Activity.Devotee.FirstName$': { [Op.like]: `%${search}%` } },
            { '$Activity.Devotee.LastName$': { [Op.like]: `%${search}%` } },
            { '$Activity.Devotee.Phone$': { [Op.like]: `%${search}%` } },
            { '$Activity.Devotee.Email$': { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const receipts = await Receipt.findAll({
      where: whereClause,
      include: [
        {
          model: Activity,
          include: [
            { model: Devotee, attributes: ['FirstName', 'LastName', 'Email', 'Address', 'City', 'State', 'Zip'] },
            { model: Service, attributes: ['Service'] },
            { model: User, as: 'AssistedBy', attributes: ['username'] },
            { model: ModeOfPayment, attributes: ['MethodName'] }
          ]
        }
      ],
      order: [['approvaldate', 'DESC']]
    });

    const approvedReceipts = receipts.map(receipt => {
      const activity = receipt.Activity || {};
      const devotee = activity.Devotee || {};
      const service = activity.Service || {};
      const modeOfPayment = activity.ModeOfPayment || {};
      const assistedBy = activity.AssistedBy || {};

      return {
        receiptid: receipt.receiptid,
        ActivityId: activity.ActivityId,
        Name: `${devotee.FirstName || ''} ${devotee.LastName || ''}`,
        Address1: devotee.Address,
        Address2: `${devotee.City || ''} ${devotee.State || ''} ${devotee.Zip || ''}`,
        Email: devotee.Email || '',
        Service: receipt.servicetype,
        ActivityDate: activity.ActivityDate,
        ServiceDate: activity.ServiceDate,
        ApprovedDate: receipt.approvaldate,
        CheckNumber: activity.CheckNumber,
        PaymentMethod: modeOfPayment.MethodName,
        PaymentDate: activity.ServiceDate,
        Amount: activity.Amount,
        AssistedBy: assistedBy.username || '',
        emailsentcount: receipt.emailsentcount || 0
      };
    });

    res.status(200).json(approvedReceipts);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching approved receipts:', err);
    res.status(500).json({ message: 'Error fetching approved receipts', error: err.message });
  }
});

// Delete a receipt by ID
app.delete('/receipts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Ensure you are deleting the receipt from the correct model/table
    const result = await Activity.destroy({
      where: { ActivityId: id } // or use a different identifier if necessary
    });

    if (result) {
      res.status(200).json({ message: 'Receipt deleted successfully' });
    } else {
      res.status(404).json({ message: 'Receipt not found' });
    }
  } catch (err) {
    await reportError(err);
    console.error('Error deleting receipt:', err);
    res.status(500).json({ message: 'Error deleting receipt', error: err.message });
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
    await reportError(err);
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
    await reportError(err);
    console.error('Error approving receipt:', err);
    res.status(500).json({ message: 'Error approving receipt', error: err.message });
  }
});

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/send-receipt-email', upload.single('pdf'), async (req, res) => {
  const email = req.body.email;
  const pdfBuffer = req.file.buffer;
  const pdfName = req.file.originalname;
  const { Name, ActivityDate, receiptid } = req.body;

  try {
    // Step 1: Fetch email credentials
    const emailCredential = await EmailCredential.findOne();
    if (!emailCredential) {
      return res.status(500).send('Email credentials not configured');
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: emailCredential.email,
        pass: emailCredential.appPassword,
      },
    });

    const mailOptions = {
      from: emailCredential.email,
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
          content: pdfBuffer,
        },
      ],
    };

    // Step 3: Send email
    try {
      const info = await transporter.sendMail(mailOptions);

      // Log successful email in EmailLog
      await EmailLog.create({
        status: 'Sent',
        name: Name || 'Unknown',
        email,
        message: `Receipt Id: ${receiptid}`,
        module: 'Receipt',
      });

    // Update emailsentcount in the database
      const receipt = await Receipt.findOne({ where: { receiptid } });
      if (receipt) {
        receipt.emailsentcount += 1;
        await receipt.save();
      }

      return res.status(200).send(`Email sent: ${info.response}`);
    } catch (emailError) {
      console.error('Error sending email:', emailError);

      // Log email error in EmailLog
      await EmailLog.create({
        status: 'Error',
        name: Name || 'Unknown',
        email,
        message: `Receipt Id: ${receiptid}. Error: ${emailError.message}`,
        module: 'Receipt',
      });

      return res.status(500).send('Error sending email');
    }
  } catch (err) {
    console.error('Unexpected error:', err);

    // Log unexpected errors in EmailLog
    await EmailLog.create({
      status: 'Error',
      name: Name || 'Unknown',
      email,
      message: `Receipt Email: ${err.message}`,
      module: 'Receipt',
    });

    return res.status(500).json({ message: 'An unexpected error occurred', error: err.message });
  }
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
    await reportError(error);
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Error updating activity', error: error.message });
  }
});


// Updated code for reports page
app.get('/reports', authenticateToken, async (req, res) => {
  const { startDate, endDate, service, paymentMethod, devoteeId } = req.query;

  const whereClause = {
    ActivityDate: {
      [Op.between]: [new Date(startDate), new Date(new Date(endDate).setHours(23, 59, 59, 999))]
    }
  };

  try {
    if (service && service !== 'null') {
      whereClause.ServiceId = service;
    }

    if (paymentMethod && paymentMethod !== 'null') {
      whereClause.PaymentMethod = paymentMethod;
    }

    if (devoteeId) {
      whereClause.DevoteeId = devoteeId;
    }

    const activities = await Activity.findAll({
      where: whereClause,
      include: [
        { model: Devotee, attributes: ['DevoteeId', 'FirstName', 'LastName', 'Phone'], required: true },
        { model: Service, attributes: ['Service'], required: true },
        { model: ModeOfPayment, attributes: ['MethodName'], required: true },
        {
          model: Receipt,
          attributes: [],
          required: true // Only include activities that have a corresponding receipt
        }
      ],
      attributes: ['ActivityId', 'DevoteeId', 'ServiceId', 'Amount', 'ActivityDate', 'ServiceDate', 'PaymentMethod', 'CheckNumber'],
      order: [['ActivityDate', 'DESC']]
    });

    const reportData = activities.map(activity => ({
      DevoteeId: activity.Devotee.DevoteeId,
      Name: `${activity.Devotee.FirstName} ${activity.Devotee.LastName}`,
      Phone: activity.Devotee.Phone,
      Service: activity.Service.Service,
      Amount: activity.Amount,
      Date: activity.ActivityDate,
      ServiceDate: activity.ServiceDate,
      'Payment Method': activity.ModeOfPayment.MethodName,
      CheckNumber: activity.CheckNumber // Ensure CheckNumber is included
    }));

    res.status(200).json(reportData);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching reports:', err);
    res.status(500).json({ message: 'Error fetching reports', error: err.message });
  }
});

// General Configurations Routes
app.get('/general-configurations', async (req, res) => {
  try {
    const autoApproveConfig = await GeneralConfigurations.findOne({ where: { configuration: 'autoApprove' } });
    const excelSevaEmailConfig = await GeneralConfigurations.findOne({ where: { configuration: 'excelSevaEmailConformation' } });
    const sareeCollectRemainderConfig = await GeneralConfigurations.findOne({ where: { configuration: 'sareeCollectRemainder' } });

    res.json({
      autoApprove: autoApproveConfig ? autoApproveConfig.value === '1' : false,
      excelSevaEmailConformation: excelSevaEmailConfig ? excelSevaEmailConfig.value === '1' : false,
      sareeCollectRemainder: sareeCollectRemainderConfig ? sareeCollectRemainderConfig.value === '1' : false,
    });
  } catch (error) {
    await reportError(error);
    res.status(500).json({ message: 'Error fetching general configurations', error });
  }
});

app.put('/general-configurations', async (req, res) => {
  try {
    const { autoApprove, excelSevaEmailConformation, sareeCollectRemainder } = req.body;

    await GeneralConfigurations.update(
      { value: autoApprove ? '1' : '0' },
      { where: { configuration: 'autoApprove' } }
    );

    await GeneralConfigurations.update(
      { value: excelSevaEmailConformation ? '1' : '0' },
      { where: { configuration: 'excelSevaEmailConformation' } }
    );

    await GeneralConfigurations.update(
      { value: sareeCollectRemainder ? '1' : '0' },
      { where: { configuration: 'sareeCollectRemainder' } }
    );

    res.json({ message: 'General configurations updated successfully' });
  } catch (error) {
    await reportError(error);
    res.status(500).json({ message: 'Error updating general configurations', error });
  }
});

// End of updated code for reports page

//to search reports with devotee name 
app.get('/devotees/search', async (req, res) => {
  const { query } = req.query;
  try {
    const devotees = await Devotee.findAll({
      where: {
        [Op.or]: [
          { DevoteeId: { [Op.like]: `%${query}%` } },
          { FirstName: { [Op.like]: `%${query}%` } },
          { LastName: { [Op.like]: `%${query}%` } },
          { Phone: { [Op.like]: `%${query}%` } },
          { Email: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['DevoteeId', 'FirstName', 'LastName', 'Email', 'Phone'],
      order: [['FirstName', 'ASC']]
    });
    res.status(200).json(devotees);
  } catch (err) {
    await reportError(err);
    console.error('Error searching devotees:', err);
    res.status(500).json({ message: 'Error searching devotees', error: err.message });
  }
});


app.get('/devotee/:id', async (req, res) => {
  try {
    const devotee = await Devotee.findByPk(req.params.id, {
      attributes: ['FirstName', 'LastName', 'Email']
    });

    if (!devotee) {
      return res.status(404).json({ message: 'Devotee not found' });
    }

    res.status(200).json(devotee);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching devotee details:', error);
    res.status(500).json({ message: 'Error fetching devotee details', error: error.message });
  }
});

app.post('/send-report-email', upload.single('pdf'), async (req, res) => {
  const email = req.body.email;
  const pdfBuffer = req.file.buffer;
  const pdfName = req.file.originalname;

  const { Name, startDate, endDate } = req.body;

  try {
    // Fetch email credentials from the database
    const emailCredential = await EmailCredential.findOne();
    if (!emailCredential) {
      return res.status(404).json({ message: 'Email credentials not found' });
    }

    // Configure nodemailer transport with dynamic credentials
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: emailCredential.email,
        pass: emailCredential.appPassword,
      },
    });

    const mailOptions = {
      from: emailCredential.email,
      to: email,
      subject: `Seva Report between ${startDate} and ${endDate}`,
      text: `Dear ${Name},

Please find the Report attached to this email.

Sincerely,
Sringeri Education and Vedic Academy.`,
      attachments: [
        {
          filename: pdfName,
          content: pdfBuffer,
        },
      ],
    };

    try {
      // Send the email
      const info = await transporter.sendMail(mailOptions);

      // Log successful email in EmailLog
      await EmailLog.create({
        status: 'Sent',
        name: Name || 'Unknown',
        email,
        message: `Seva report for the period ${startDate} to ${endDate}`,
        module: 'Report',
      });

      return res.status(200).send(`Email sent: ${info.response}`);
    } catch (emailError) {
      console.error('Error sending email:', emailError);

      // Log email error in EmailLog
      await EmailLog.create({
        status: 'Error',
        name: Name || 'Unknown',
        email,
        message: `Seva report for the period ${startDate} to ${endDate}. Error: ${emailError.message}`,
        module: 'Report',
      });

      return res.status(500).send('Error sending email');
    }
  } catch (error) {
    console.error('Unexpected error:', error);

    // Log unexpected error in EmailLog
    await EmailLog.create({
      status: 'Error',
      name: Name || 'Unknown',
      email,
      message: `Unexpected error occurred while sending Seva report. Error: ${error.message}`,
      module: 'Report',
    });

    return res.status(500).json({ message: 'An unexpected error occurred', error: error.message });
  }
});


app.get('/access-control/:userType', async (req, res) => {
  try {
    const userType = req.params.userType;
    console.log(`Fetching access control data for user type: ${userType}`);
    if (!userType) {
      return res.status(400).json({ message: 'User type is required' });
    }

    const accessControl = await AccessControl.findAll({ where: { usertype: userType } });

    if (!accessControl || accessControl.length === 0) {
      console.log(`Access control data not found for user type: ${userType}`);
      return res.status(404).json({ message: 'Access control data not found' });
    }

    const accessMap = accessControl.reduce((acc, control) => {
      acc[control.component] = {
        can_view: control.can_view,
        can_add: control.can_add,
        can_edit: control.can_edit,
        can_delete: control.can_delete,
        can_approve: control.can_approve,
        can_email: control.can_email

      };
      return acc;
    }, {});

    console.log(`Access control data found: ${JSON.stringify(accessMap)}`);
    res.status(200).json(accessMap);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching access control data:', error);
    res.status(500).json({ message: 'Error fetching access control data', error: error.message });
  }
});

// Add this new route to fetch all access control data
app.get('/access-control', async (req, res) => {
  try {
    const accessControl = await AccessControl.findAll();
    if (!accessControl || accessControl.length === 0) {
      return res.status(404).json({ message: 'Access control data not found' });
    }
    res.status(200).json(accessControl);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching access control data:', error);
    res.status(500).json({ message: 'Error fetching access control data', error: error.message });
  }
});

// Add this route to fetch all access control data
app.get('/access-control', async (req, res) => {
  try {
    const accessControl = await AccessControl.findAll();
    res.status(200).json(accessControl);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching access control data:', error);
    res.status(500).json({ message: 'Error fetching access control data', error: error.message });
  }
});

// Fetch email logs
app.get('/email-logs', async (req, res) => {
  try {
    const logs = await EmailLog.findAll({
      order: [['log_datetime', 'DESC']], // Sort by date descending
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).send('Failed to fetch email logs');
  }
});

app.put('/access-control', async (req, res) => {
  try {
    const accessControls = req.body;

    if (!Array.isArray(accessControls) || accessControls.length === 0) {
      return res.status(400).json({ message: 'Invalid access control data' });
    }

    const updatePromises = accessControls.map(control => {
      return AccessControl.update(
        {
          can_view: control.can_view,
          can_add: control.can_add,
          can_edit: control.can_edit,
          can_delete: control.can_delete,
          can_approve: control.can_approve,
          can_email: control.can_email,
        },
        {
          where: { id: control.id }
        }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Access controls updated successfully' });
  } catch (error) {
    await reportError(error);
    console.error('Error updating access controls:', error);
    res.status(500).json({ message: 'Error updating access controls', error: error.message });
  }
});

// Fetch email credentials
app.get('/email-credentials', async (req, res) => {
  try {
    const emailCredential = await EmailCredential.findOne();
    if (!emailCredential) {
      return res.status(404).json({ message: 'Email credentials not found' });
    }
    res.status(200).json(emailCredential);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching email credentials:', error);
    res.status(500).json({ message: 'Error fetching email credentials', error: error.message });
  }
});

// Update email credentials
app.put('/email-credentials', async (req, res) => {
  const { email, appPassword } = req.body;
  try {
    let emailCredential = await EmailCredential.findOne();
    if (emailCredential) {
      emailCredential.email = email;
      emailCredential.appPassword = appPassword;
      await emailCredential.save();
    } else {
      emailCredential = await EmailCredential.create({ email, appPassword });
    }
    res.status(200).json({ message: 'Email credentials updated successfully' });
  } catch (error) {
    await reportError(error);
    console.error('Error updating email credentials:', error);
    res.status(500).json({ message: 'Error updating email credentials', error: error.message });
  }
});

// Endpoint to get activities for a specific date
app.get('/todays-events', async (req, res) => {
  try {
    const { date } = req.query;

    const activities = await Activity.findAll({
      where: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('ServiceDate')), date),
      include: [
        { model: Devotee, attributes: ['FirstName', 'LastName', 'Gotra', 'Star', 'DevoteeId'] },
        { model: Service, attributes: ['Service'] },
      ],
    });

    // Group activities by service
    const groupedActivities = await activities.reduce(async (accPromise, activity) => {
      const acc = await accPromise;
      const serviceName = activity.Service.Service;
      if (!acc[serviceName]) {
        acc[serviceName] = [];
      }

      const familyMembers = await Family.findAll({
        where: { DevoteeId: activity.Devotee.DevoteeId },
        attributes: ['FirstName', 'LastName', 'RelationShip', 'Gotra', 'Star'],
      });

      acc[serviceName].push({
        SerialNumber: acc[serviceName].length + 1,
        ActivityId: activity.ActivityId,
        FirstName: activity.Devotee.FirstName,
        LastName: activity.Devotee.LastName,
        Gotra: activity.Devotee.Gotra,
        Star: activity.Devotee.Star,
        FamilyMembers: familyMembers.map(member => ({
          RelationShip: member.RelationShip,
          FirstName: member.FirstName,
          LastName: member.LastName,
          Gotra: member.Gotra,
          Star: member.Star,
        })),
      });

      return acc;
    }, Promise.resolve({}));

    res.status(200).json(groupedActivities);
  } catch (err) {
    await reportError(err);
    console.error('Error fetching activities for date:', err);
    res.status(500).json({ message: 'Error fetching activities for date', error: err.message });
  }
});

const fetchPanchangaForDate = async (date) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID_PANCHANGA,
      range: RANGE_PANCHANGA
    });

    const rows = response.data.values;
    if (rows.length) {
      const panchanga = rows.find(row => row[0] === date);
      if (panchanga) {
        return {
          Date: panchanga[0],
          Samvatsara: panchanga[1],
          Ayana: panchanga[2],
          Ritu: panchanga[3],
          Paksha: panchanga[4],
          Tithi: panchanga[5],
          Vaasara: panchanga[6],
          Nakshatra: panchanga[7]
        };
      }
    }
    return {};
  } catch (error) {
    await reportError(error);
    console.error('Error fetching Panchanga from Google Sheets:', error);
    return {};
  }
};

app.get("/api/panchanga", async (req, res) => {
  try {
    // Fetch Panchanga data from the external website
    const response = await axios.get(
      "https://www.mypanchang.com/newsite/compactfeed.php?pt=10pt&displaymode=full"
    );
    
    // Parse HTML response
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Extract Panchanga details
    const rawHtml = document.querySelector("#basicdata").innerHTML.split("<br>");
    const basicDataDiv = rawHtml.map(line => line.replace(/<[^>]*>/g, '').trim());

    const samvatsara = basicDataDiv[2]?.split(":")[1]?.trim().split(" ")[0] || "Unknown";
    const paksha = basicDataDiv[8] || "Unknown";
    const tithiRaw = basicDataDiv[9]?.trim() || "Unknown"; // Includes till time
    const nakshatra = basicDataDiv[10]?.trim() || "Unknown";

    // Determine Ayana
    const currentMonth = new Date().getMonth() + 1;
    const ayanam = currentMonth < 8 ? "Uttarayane" : "Dakshinayane";

    // Map month to season (Ruthow)
    const seasonMap = {
      5: "Vasantha", 4: "Vasantha",
      7: "Greeshma", 6: "Greeshma",
      9: "Varsha", 8: "Varsha",
      11: "Sharath", 10: "Sharath",
      12: "Hemanth", 1: "Shishira",
      3: "Shishira", 2: "Shishira"
    };
    const season = seasonMap[currentMonth] || "Unknown";

    // Determine Vaasara (Day of the week)
    const dayOfWeekMap = ["Baanu", "Indu", "Bhowma", "Soumya", "Guru", "Brighu", "Sthira"];
    const currentDay = new Date().getDay();
    const vaasara = dayOfWeekMap[currentDay];

    // Send extracted data as JSON
    res.json({
      Samvatsara: samvatsara,
      Ayana: ayanam,
      Ritu: season,
      Paksha: paksha,
      Tithi: tithiRaw,
      Vaasara: vaasara,
      Nakshatra: nakshatra
    });

  } catch (error) {
    console.error("Error fetching Panchanga:", error);
    res.status(500).json({ error: "Failed to fetch Panchanga data" });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// Cp start

const { google } = require('googleapis');
const cron = require('node-cron');

const serviceAccount = require('./service-account.json');
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
});
const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

function extractDocumentId(input) {
  const idRegex = /^[a-zA-Z0-9-_]+$/; // Matches only IDs
  const urlRegex = /\/d\/([a-zA-Z0-9-_]+)/; // Matches URLs

  if (idRegex.test(input)) {
    // If input is already an ID, return it
    return input;
  } else {
    // If input is a URL, extract the ID
    const matches = input.match(urlRegex);
    return matches ? matches[1] : null;
  }
}

let sheetServiceMap = {};

async function initializeSheetServiceMap() {
  try {
    const services = await Service.findAll({
      where: {
        excelSheetLink: {
          [Op.not]: null,
          [Op.ne]: '',
        },
      },
    });

    const categories = await ServiceCategory.findAll({
      where: {
        excelSheetLink: {
          [Op.not]: null,
          [Op.ne]: '',
        },
      },
    });

    sheetServiceMap = {};

    // Map service-level sheets
    services.forEach((service) => {
      const documentId = extractDocumentId(service.excelSheetLink);
      if (documentId) {
        sheetServiceMap[documentId] = {
          type: 'service',
          id: service.ServiceId,
        };
      }
    });

    // Map category-level sheets
    categories.forEach((category) => {
      const documentId = extractDocumentId(category.excelSheetLink);
      if (documentId) {
        sheetServiceMap[documentId] = {
          type: 'category',
          id: category.category_id,
        };
      }
    });
  } catch (error) {
    await reportError(error);
    console.error('Error initializing sheet service map:', error);
    throw error;
  }
}

async function fetchDataFromSheets() {

  processNewSheet();
  
  try {
    await initializeSheetServiceMap(); // Initialize the map before fetching data

    let newEntriesCount = 0;
    for (const [sheetId, mapping] of Object.entries(sheetServiceMap)) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A:AZ', // Adjust range as needed
      });

      const rows = response.data.values;
      if (!rows) {
        console.error(`No data found in sheet: ${sheetId}`);
        continue;
      }

      if (rows.length) {
        console.log(`Fetched ${rows.length} rows from sheet ${sheetId}`);
        const headers = rows[0].map((header) => header.split('|')[0]); // Extract headers
        for (let index = 1; index < rows.length; index++) {
          const row = rows[index];
          if (!row[0]) {
            console.log(`Processing row ${index} from sheet ${sheetId}:`, row);
            const rowData = headers.reduce((acc, header, i) => {
              acc[header] = row[i];
              return acc;
            }, {});

            if (mapping.type === 'service') {
              await processServiceRow(rowData, sheetId, index + 1, mapping.id);
            } else if (mapping.type === 'category') {
              await processCategoryRow(rowData, sheetId, index + 1, mapping.id);
            }

            newEntriesCount++;
          }
        }
      } else {
        console.log('No data found in sheet:', sheetId);
      }
    }
    return newEntriesCount;
  } catch (error) {
    await reportError(error);
    console.error('Error fetching data from Google Sheets:', error);
    throw error;
  }
}

async function processCategoryRow(rowData, sheetId, rowIndex, categoryId) {
  const {
    Status,
    'Seva ID': sevaId,
    'First Name': firstName,
    'Last Name': lastName,
    'Email Address': email,
    Phone: phone,
    Date: rawDate,
    'Message to Priest': messageToPriest,
    'Payment Option': paymentStatus,
    'Card Details': cardDetails,
    'Donation Amount': amountStr,
    'Select Event': selectEventStr,
    'Additional Donation': additionalDonationFlag,
  } = rowData;

  const date = rawDate || new Date().toISOString().split('T')[0];

  const message = messageToPriest || '';
  const donationAmount = parseFloat(amountStr || 0);
  const finalLastName = lastName || ' ';
  const finalPhone = phone || 0;

  let selectedEvents = [];
  try {
    selectedEvents = JSON.parse(selectEventStr);
  } catch (e) {
    console.error('Error parsing Select Event:', selectEventStr);
    selectedEvents = [];
  }

  console.log('Processing row with values:', {
    firstName,
    lastName,
    email,
    phone,
    message,
    selectedEvents,
  });

  if (!firstName || !email) {
    console.error('Required fields are missing:', {
      firstName,
      email,
    });
    return;
  }

  // const devotee = await findOrCreateDevotee({
  //   firstName,
  //   lastName,
  //   email,
  //   phone,
  // });

  const devotee = await findOrCreateDevotee({ firstName, lastName: finalLastName, email, phone: finalPhone });


  let totalServiceRate = 0;
  let serviceActivities = [];

  for (const eventName of selectedEvents) {
    let service = await Service.findOne({
      where: {
        Service: eventName,
        category_id: categoryId,
      },
    });

    let rate = 0;

    if (service) {
      rate = service.Rate;
    } else {
      service = await Service.findOne({ where: { Service: 'Donation' } });
      if (!service) {
        console.error('General Donation service not found');
        continue;
      }
      rate = service.Rate;
    }

    totalServiceRate += rate;

    let activityId = null;
    if (paymentStatus === 'Paid' || paymentStatus === 'Benevity') {
      activityId = await createActivity({
        devoteeId: devotee.DevoteeId,
        serviceId: service.ServiceId,
        paymentStatus: paymentStatus === 'Paid' ? 'Paid Online' : paymentStatus,
        amount: rate,
        serviceDate: date,
        comments: message,
        UserId: 'Website',
      });
    }

    serviceActivities.push({ service, rate, activityId });
  }

  // Handle Additional Donation logic
  if (additionalDonationFlag === 'one' && donationAmount > totalServiceRate) {
    const donationRate = donationAmount - totalServiceRate;
    const donationService = await Service.findOne({ where: { Service: 'Donation' } });

    if (donationService) {
      let donationActivityId = null;
      if (paymentStatus === 'Paid' || paymentStatus === 'Benevity') {
        donationActivityId = await createActivity({
          devoteeId: devotee.DevoteeId,
          serviceId: donationService.ServiceId,
          paymentStatus: paymentStatus === 'Paid' ? 'Paid Online' : paymentStatus,
          amount: donationRate,
          serviceDate: date,
          comments: message,
          UserId: 'Website',
        });
      }

      serviceActivities.push({
        service: donationService,
        rate: donationRate,
        activityId: donationActivityId,
      });
    } else {
      console.error('General Donation service not found for additional donation');
    }
  }

  // Update Excel and send emails
  for (const { service, rate, activityId } of serviceActivities) {
    await updateExcelSevaData({
      seva_id: sevaId || activityId || 'Unknown',
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      date,
      message,
      payment_status: paymentStatus,
      card_details: cardDetails || '',
      sheet_name: sheetId,
      devotee_id: devotee.DevoteeId,
      amount: rate,
      status: devotee.isNew ? 'New Devotee' : 'Existing Devotee',
      row_index: rowIndex,
      ServiceId: service.ServiceId,
    });

    await sendSevaEmail({
      email,
      serviceId: service.ServiceId,
      serviceDate: date,
      amount: rate,
      paymentStatus,
      firstName,
      lastName,
    });
  }

  // Update sheet status
  if (rowIndex <= 1000) {
    await updateSheetStatus(
      sheetId,
      rowIndex,
      devotee.isNew ? 'New Devotee' : 'Existing Devotee'
    );
    if (paymentStatus === 'Paid' || paymentStatus === 'Benevity') {
      await updateSheetSevaId(sheetId, rowIndex, sevaId || 'Multiple');
    }
  } else {
    console.error(`Row index ${rowIndex} exceeds Google Sheets limit.`);
  }
}

async function processServiceRow(rowData, sheetId, rowIndex, serviceId) {
  const {
    Status,
    'Seva ID': sevaId,
    'First Name': firstName1,
    'First Name': firstName2,
    'Last Name': lastName1,
    'Last Name': lastName2,
    'Email Address': email,
    Phone: phone,
    Date: date1,
    'Puja Date (eg. Birthdays, Anniversary)': date2,
    'Message to Priest': messageToPriest,
    'Gotra & Nakshatra details (Details for Priest)': gotraDetails,
    'Payment Option': paymentStatus1,
    'Payment Method': paymentStatus2,
    'Card Details': cardDetails1,
    'Credit / Debit Card': cardDetails2,
    'Suggested Donation': amount1,
    'Yearly (USD)': yearlyAmount,
    'Monthly Pledge (USD)': monthlyAmount,
    'Select': selectOption,
    'Batch': batchInfo,
  } = rowData;

  const firstName = firstName1 || firstName2;
  const lastName = lastName1 || lastName2;
  const rawDate = date1 || date2;
  const date = rawDate || new Date().toISOString().split('T')[0];
  const message = messageToPriest || gotraDetails || '';
  const paymentStatus = paymentStatus1 || paymentStatus2;
  const cardDetails = cardDetails1 || cardDetails2;
  const temp_amount = selectOption === 'Yearly' ? yearlyAmount : selectOption === 'Monthly' ? monthlyAmount : amount1;
  const amount = temp_amount ? temp_amount:0;
  const batchTimeMatch = batchInfo ? batchInfo.match(/\(([^)]+)\)/) : null;
  const batchTime = batchTimeMatch ? batchTimeMatch[1] : null;


  console.log('Processing row with values:', { firstName, lastName, email, phone, message });

  if (!firstName || !lastName || !email || !phone) {
    console.error('Required fields are missing:', { firstName, lastName, email, phone });
    return;
  }

  const devotee = await findOrCreateDevotee({ firstName, lastName, email, phone });
  // const websiteUser = await User.findOne({ where: { username: 'Website' } });
  // console.log("website user ------------>",websiteUser.username,"------", websiteUser.userid)

  let activityId = null;
  if (paymentStatus === 'Paid') {
    activityId = await createActivity({
      devoteeId: devotee.DevoteeId,
      serviceId,
      paymentStatus:'Paid Online',
      amount,
      serviceDate: date,
      comments: message,
      UserId: 'Website'
    });
  } else if (paymentStatus === 'Benevity'){
    activityId = await createActivity({
      devoteeId: devotee.DevoteeId,
      serviceId,
      paymentStatus,
      amount,
      serviceDate: date,
      comments: message,
      UserId: 'Website'
    });
  }

  const updatedExcelSevaData = await updateExcelSevaData({
    seva_id: sevaId || activityId || 'Unknown',
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    date: date,
    message: message,
    payment_status: paymentStatus,
    card_details: cardDetails || '',
    sheet_name: sheetId,
    devotee_id: devotee.DevoteeId,
    amount,
    status: devotee.isNew ? 'New Devotee' : 'Existing Devotee',
    row_index: rowIndex,
    ServiceId: serviceId
  });

  await sendSevaEmail({
    email,
    serviceId,
    serviceDate: date,
    amount,
    paymentStatus,
    firstName,
    lastName,
    batchTime
  });

  if (rowIndex <= 1000) {
    await updateSheetStatus(sheetId, rowIndex, devotee.isNew ? 'New Devotee' : 'Existing Devotee');
    if (paymentStatus === 'Paid' || paymentStatus === 'Benevity') {
      await updateSheetSevaId(sheetId, rowIndex, sevaId || activityId);
    }
  } else {
    console.error(`Row index ${rowIndex} exceeds Google Sheets limit.`);
  }
}

const { createICalEvent } = require('./ical');
const path = require('path');
const fs = require('fs');

async function sendSevaEmail({ email, serviceId, serviceDate, amount, paymentStatus, firstName, lastName, batchTime }) {
  try {
    // Fetch service details
    //console.log('Fetching service details for ServiceId:', serviceId);
    const service = await Service.findByPk(serviceId);
    if (!service) {
      console.error('Service not found:', serviceId);
      return;
    }
    //console.log('Service details:', service);

    // Fetch email credentials
    console.log('Fetching email credentials');
    const emailCredential = await EmailCredential.findOne();
    if (!emailCredential) {
      console.error('Email credentials not found');
      return;
    }
    //console.log('Email credentials:', emailCredential);

    // Fetch email configuration
    console.log('Fetching email configuration for excelSevaEmailConformation');
    const generalConfig = await GeneralConfigurations.findOne({ where: { configuration: 'excelSevaEmailConformation' } });
    if (!generalConfig || generalConfig.value !== '1') {
      console.log('Email sending is disabled by configuration');
      return;
    }
    console.log('Email configuration:', generalConfig);

    // Create transporter for email
    console.log('Creating email transporter');
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: emailCredential.email,
        pass: emailCredential.appPassword,
      },
    });

    // Determine service time
    console.log('Determining service time', batchTime);
    const convertTo24HourFormat = (time) => {
      const [hourMinute, period] = time.match(/(\d+:\d+)([ap]m)/i).slice(1);
      let [hours, minutes] = hourMinute.split(':').map(Number);

      if (period.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const serviceTime = batchTime
      ? convertTo24HourFormat(batchTime)
      : service.time || '18:00';

    const serviceDateTimeString = `${serviceDate} ${serviceTime}`;
    const serviceDateTime = new Date(serviceDateTimeString);
    if (isNaN(serviceDateTime.getTime())) {
      console.error('Invalid service date and time:', serviceDateTimeString);
      return;
    }
    const dayOfWeek = serviceDateTime.toLocaleString('en-US', { weekday: 'long' });
    const formattedDate = serviceDateTime.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const bannerImageUrl = 'https://drive.google.com/uc?export=view&id=1YbZwheefs9K-uebzYPsmGYL9IFHteqvS';

    let subject, html, attachments = [];

    if (service.ServiceId === 2) {
      subject = `${service.Service} received at SEVA`;
      html = `
        <div style="text-align: center;">
          <div style="display: inline-block; border: 3px solid orange; padding: 20px; text-align: left; max-width: 600px;">
            <img src="${bannerImageUrl}" alt="Email Banner" style="width: 100%; max-width: 580px;" />
            <h2 style="color: grey; text-align: center; font-size: 24px;">${service.Service}</h2>
            <p><b>Seva:</b> ${service.Service} of $${amount} received.</p>
            <p>Thank you for your continued support in upholding our temple's spiritual efforts.</p>
            <p>We warmly invite you and your family to visit the temple for darshan and blessings.</p>
            <p>You're welcome to bring flowers and fruits as offerings if you wish.</p>

            <p><a href="https://www.google.com/maps/search/?api=1&query=1635+S+Main+St,+Milpitas,+CA+95035" target="_blank">Sri Sharadamba Temple (1635 S Main St, Milpitas, CA 95035)</a></p>
            
          </div>
        </div>
      `;
    } else {
      const icalContent = await createICalEvent({
        service: service.Service,
        date: serviceDateTime,
      });

      subject = `${service.Service} Seva on ${dayOfWeek}, ${formattedDate}`;
      html = `
        <div style="text-align: center;">
          <div style="display: inline-block; border: 3px solid orange; padding: 20px; text-align: left; max-width: 600px;">
            <img src="${bannerImageUrl}" alt="Email Banner" style="width: 100%; max-width: 580px;" />
            <h2 style="color: grey; text-align: center; font-size: 24px;">${service.Service} Seva Scheduled</h2>
            <p><b>Seva:</b> ${service.Service}</p>
            <p><b>When:</b> ${dayOfWeek}, ${formattedDate}</p>
            <p><b>Where:</b> <a href="https://www.google.com/maps/search/?api=1&query=1635+S+Main+St,+Milpitas,+CA+95035" target="_blank">Sri Sharadamba Temple (1635 S Main St, Milpitas, CA 95035)</a></p>
            <p>Thank you for your continued support. We invite you and your family to visit the temple to receive blessings.</p>
            <p>If you wish, feel free to bring flowers and fruits as offerings.</p>
          </div>
        </div>
      `;
      attachments.push({
        filename: 'invite.ics',
        content: icalContent,
        contentType: 'text/calendar',
      });
    }

    const mailOptions = {
      from: emailCredential.email,
      to: email,
      subject,
      html,
      attachments,
    };

    try {
      // Send email
      console.log('Sending email to:', email);
      const info = await transporter.sendMail(mailOptions);

      // Log successful email in EmailLog
      await EmailLog.create({
        status: 'Sent',
        name: `${firstName} ${lastName}`.trim(),
        email,
        message: `Seva email sent for service "${service.Service}" on ${formattedDate}.`,
        module: 'New Seva',
      });

      console.log('Email sent successfully:', info.response);
    } catch (emailError) {
      console.error('Error sending email:', emailError);

      // Log email error in EmailLog
      await EmailLog.create({
        status: 'Error',
        name: `${firstName} ${lastName}`.trim(),
        email,
        message: `Failed to send seva email for service "${service.Service}". Error: ${emailError.message}`,
        module: 'New Seva',
      });
    }
  } catch (error) {
    console.error('Error in sendSevaEmail:', error);

    // Log unexpected error in EmailLog
    await EmailLog.create({
      status: 'Error',
      name: `${firstName} ${lastName}`.trim(),
      email,
      message: `Unexpected error occurred while sending seva email. Error: ${error.message}`,
      module: 'New Seva',
    });
  }
}

module.exports = {
  sendSevaEmail
};

async function findOrCreateDevotee({ firstName, lastName, email, phone }) {
  try {
    console.log('Finding or creating devotee with values:', { firstName, lastName, email, phone });
    let devotee = await Devotee.findOne({ where: { Email: email } });
    if (!devotee) {
      devotee = await Devotee.findOne({ where: { Phone: phone } });
      if (!devotee) {
        devotee = await Devotee.create({ FirstName: firstName, LastName: lastName, Email: email, Phone: phone });
        devotee.isNew = true;
      } else {
        devotee.isNew = false;
      }
    } else {
      devotee.isNew = false;
    }
    return devotee;
  } catch (error) {
    await reportError(error);
    console.error('Error finding or creating devotee:', error);
    throw error;
  }
}

async function createActivity({ devoteeId, serviceId, paymentStatus, amount, serviceDate, comments, UserId}) {
  try {
    // Retrieve the payment method ID from ModeOfPayment table based on paymentStatus
    const modeOfPayment = await ModeOfPayment.findOne({ where: { MethodName: paymentStatus } });

    if (!modeOfPayment) {
      throw new Error(`Mode of Payment not found for payment status: ${paymentStatus}`);
    }

    // Set UserId based on payment status
    const assignedUserId = (paymentStatus === 'Paid' || paymentStatus === 'Benevity') ? 'Website' : UserId;

    const activity = await Activity.create({
      DevoteeId: devoteeId,
      ServiceId: serviceId,
      PaymentMethod: modeOfPayment.PaymentMethodId,
      Amount: amount,
      UserId: assignedUserId,
      ServiceDate: serviceDate,
      Comments: comments
    });

    return activity.ActivityId;
  } catch (error) {
    await reportError(error);
    console.error('Error creating activity:', error);
    throw error;
  }
}

async function createActivity_maintainDate({ devoteeId, serviceId, paymentStatus, ActivityDate, amount, serviceDate, comments, UserId, checkNumber }) {
  try {
    const modeOfPayment = await ModeOfPayment.findOne({ where: { MethodName: paymentStatus } });

    if (!modeOfPayment) {
      throw new Error(`Mode of Payment not found for payment status: ${paymentStatus}`);
    }

    const assignedUserId = (paymentStatus === 'Paid' || paymentStatus === 'Benevity') ? 'Website' : UserId;

    const activity = await Activity.create({
      DevoteeId: devoteeId,
      ServiceId: serviceId,
      PaymentMethod: modeOfPayment.PaymentMethodId,
      Amount: amount,
      UserId: assignedUserId,
      ServiceDate: serviceDate,
      ActivityDate: ActivityDate,
      Comments: comments,
      CheckNumber: checkNumber || null, // Include CheckNumber
    });

    return activity.ActivityId;
  } catch (error) {
    await reportError(error);
    console.error('Error creating activity:', error);
    throw error;
  }
}

async function updateExcelSevaData(data) {
  try {
    const entry = await ExcelSevaData.create(data);
    return entry;
  } catch (error) {
    await reportError(error);
    console.error('Error updating excelsevadata:', error);
    throw error;
  }
}

async function updateSheetStatus(sheetId, rowIndex, status) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Sheet1!A${rowIndex}:A${rowIndex}`,
      valueInputOption: 'RAW',
      resource: { values: [[status]] }
    });
  } catch (error) {
    await reportError(error);
    console.error('Error updating Google Sheets status:', error);
    throw error;
  }
}

async function updateSheetSevaId(sheetId, rowIndex, sevaId) {
  // Disabled.
  // try {
  //   await sheets.spreadsheets.values.update({
  //     spreadsheetId: sheetId,
  //     range: `Sheet1!B${rowIndex}:B${rowIndex}`,
  //     valueInputOption: 'RAW',
  //     resource: { values: [[sevaId]] }
  //   });
  // } catch (error) {
  //   await reportError(error);
  //   console.error('Error updating Google Sheets Seva ID:', error);
  //   throw error;
  // }
}

app.post('/fetch-sheets-data', async (req, res) => {
  try {
    const newEntriesCount = await fetchDataFromSheets();
    res.status(200).json({ message: `${newEntriesCount} new entries fetched` });
  } catch (error) {
    await reportError(error);
    console.error('Error fetching data from Google Sheets:', error);
    res.status(500).json({ message: 'Error fetching data from Google Sheets', error: error.message });
  }
});

// Fetch ExcelSevaData API
app.get('/excel-seva-data', async (req, res) => {
  try {
    const excelSevaData = await ExcelSevaData.findAll({
      include: [{
        model: Service,
        attributes: ['Service']
      }]
    });
    res.status(200).json(excelSevaData);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching ExcelSevaData:', error);
    res.status(500).json({ message: 'Error fetching ExcelSevaData', error: error.message });
  }
});

// Example API route for updating payment status
app.put('/update-payment-status/:id', async (req, res) => {
  try {
    const { amount, paymentStatus, paymentStatusReal, createdAt, userId } = req.body;
    const entry = await ExcelSevaData.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    // // Check if the entry's sheet_name exists in sheetServiceMap and determine type (service or category)
    // const sheetInfo = sheetServiceMap[entry.sheet_name];
    // if (!sheetInfo) {
    //   return res.status(400).json({ message: 'Sheet not mapped to any service or category' });
    // }

    // let serviceId;
    // if (sheetInfo.type === 'service') {
    //   serviceId = sheetInfo.id;  // Use the mapped service ID
    // } else if (sheetInfo.type === 'category') {
    //   // Handle case for category (you might want to find a default service or create a category-specific activity)
    //   // Assuming you might want to link to a general service for categories, or choose one based on logic
    //   const service = await Service.findOne({ where: { category_id: sheetInfo.id } });
    //   if (!service) {
    //     return res.status(400).json({ message: 'No service found for the category' });
    //   }
    //   serviceId = service.ServiceId;  // Use service found for the category
    // }

    const serviceId = entry.ServiceId;

    if (!serviceId) {
      return res.status(400).json({ message: 'No ServiceId found in the entry. Cannot proceed with activity creation.' });
    }

    if (paymentStatus === 'Paid at temple') {

      const pstTimestamp =
        typeof createdAt === 'string'
          ? createdAt.replace(/Z$/, '') // --> "2025-07-12T17:25:39.000"
          : new Date(createdAt).toISOString().replace(/Z$/, '');
          
      const activityId = await createActivity_maintainDate({
        devoteeId: entry.devotee_id,
        serviceId,  // Pass the determined serviceId
        paymentStatus: paymentStatusReal,
        ActivityDate: pstTimestamp,
        amount,
        serviceDate: entry.date,
        comments: entry.message,
        UserId: userId,
        checkNumber: req.body.checkNumber
      });

      entry.seva_id = activityId;
      entry.payment_status = paymentStatus;
      entry.amount = amount;
      await entry.save();

      if (entry.row_index <= 1000) {
        await updateSheetSevaId(entry.sheet_name, entry.row_index, activityId);
      } else {
        console.error(`Row index ${entry.row_index} exceeds Google Sheets limit.`);
      }
    } else {
      await ExcelSevaData.destroy({ where: { id: entry.id } });
    }

    res.status(200).json({ message: 'Payment status updated successfully' });
  } catch (error) {
    await reportError(error);
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
});

// Example API route for deleting an entry
app.delete('/delete-entry/:id', async (req, res) => {
  try {
    const entry = await ExcelSevaData.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    await ExcelSevaData.destroy({ where: { id: entry.id } });
    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (error) {
    await reportError(error);
    console.error('Error deleting entry:', error);
    res.status(500).json({ message: 'Error deleting entry', error: error.message });
  }
});

app.put('/access-control', async (req, res) => {
  try {
    const accessControls = req.body;

    if (!Array.isArray(accessControls) || accessControls.length === 0) {
      return res.status(400).json({ message: 'Invalid access control data' });
    }

    const updatePromises = accessControls.map(control => {
      return AccessControl.update(
        {
          can_view: control.can_view,
          can_add: control.can_add,
          can_edit: control.can_edit,
          can_delete: control.can_delete,
          can_approve: control.can_approve,
          can_email: control.can_email,
        },
        {
          where: { id: control.id }
        }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Access controls updated successfully' });
  } catch (error) {
    await reportError(error);
    console.error('Error updating access controls:', error);
    res.status(500).json({ message: 'Error updating access controls', error: error.message });
  }
});

app.get('/email-credentials', async (req, res) => {
  try {
    const emailCredential = await EmailCredential.findOne();
    if (!emailCredential) {
      return res.status(404).json({ message: 'Email credentials not found' });
    }
    res.status(200).json(emailCredential);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching email credentials:', error);
    res.status(500).json({ message: 'Error fetching email credentials', error: error.message });
  }
});

cron.schedule('*/5 * * * *', fetchDataFromSheets);


async function processNewSheet() {
  const sheetId = '17IObqp3iINFD5_PbzzxbeSgequ-T_8199yXgLiBw0Qc';
  const range = 'Sheet1!A:Z'; // Adjust the range based on the sheet content

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      console.error('No data found or insufficient rows in the new sheet.');
      return;
    }

    const headers = rows[0]; // Extract headers from the first row
    const dataRows = rows.slice(1); // Exclude headers

    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index];
      const rowData = headers.reduce((acc, header, i) => {
        acc[header] = row[i];
        return acc;
      }, {});

      // Only process rows where Status|text-6 is empty
      if (!rowData['Status|text-6']) {
        const result = await processNewSheetRow(rowData);

        // Update the sheet with the status and Devotee ID
        await updateSheetRowStatus(sheetId, index + 2, result);
      }
    }

    console.log(`Processed ${dataRows.length} rows from the new sheet.`);
  } catch (error) {
    console.error('Error processing the new sheet:', error);
    throw error;
  }
}

async function processNewSheetRow(rowData) {
  const {
    'First Name|name-1-first-name': firstName,
    'Last Name|name-1-last-name': lastName,
    'Email Address|email-1': email,
    'Phone|phone-1': phone,
    'Address (optional)|textarea-1': address,
    'Register Gotra|text-3': gotra,
    'Nakshatra|text-4': star,
  } = rowData;

  if (!email) {
    console.error('Email is required for the devotee.');
    return { status: 'Error: Missing Email', devoteeId: null };
  }

  try {
    // Process devotee entry
    let devotee = await Devotee.findOne({ where: { Email: email } });
    let status;

    if (devotee) {
      await devotee.update({
        FirstName: firstName || devotee.FirstName,
        LastName: lastName || devotee.LastName,
        Phone: phone || devotee.Phone,
        Address: address || devotee.Address,
        Gotra: gotra || devotee.Gotra,
        Star: star || devotee.Star,
        LastModified: new Date(),
        ModifiedBy: 'Devotee Form',
      });
      console.log(`Updated existing devotee (DevoteeId: ${devotee.DevoteeId}).`);
      status = 'Devotee Updated';
    } else {
      devotee = await Devotee.create({
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Phone: phone,
        Address: address,
        Gotra: gotra,
        Star: star,
        LastModified: new Date(),
        ModifiedBy: 'Devotee Form',
      });
      console.log(`Created new devotee (DevoteeId: ${devotee.DevoteeId}).`);
      status = 'New Devotee';
    }

    // Process family entries
    const familyEntries = [
      {
        firstName: rowData['First Name|name-2-first-name'],
        lastName: rowData['Last Name|name-2-last-name'],
        gotra: rowData['Gotra|text-1'],
        star: rowData['Nakshatra|text-2'],
      },
      {
        firstName: rowData['First Name|name-2-first-name-2'],
        lastName: rowData['Last Name|name-2-last-name-2'],
        gotra: rowData['Gotra|text-1-2'],
        star: rowData['Nakshatra|text-2-2'],
      },
      {
        firstName: rowData['First Name|name-2-first-name-3'],
        lastName: rowData['Last Name|name-2-last-name-3'],
        gotra: rowData['Gotra|text-1-3'],
        star: rowData['Nakshatra|text-2-3'],
      },
      {
        firstName: rowData['First Name|name-2-first-name-4'],
        lastName: rowData['Last Name|name-2-last-name-4'],
        gotra: rowData['Gotra|text-1-4'],
        star: rowData['Nakshatra|text-2-4'],
      },
    ];

    for (const familyEntry of familyEntries) {
      if (familyEntry.firstName || familyEntry.lastName) {
        await Family.create({
          DevoteeId: devotee.DevoteeId,
          FirstName: familyEntry.firstName,
          LastName: familyEntry.lastName,
          Gotra: familyEntry.gotra,
          Star: familyEntry.star,
          LastModified: new Date(),
          ModifiedBy: 'Devotee Form',
        });
        console.log(`Added family member: ${familyEntry.firstName} ${familyEntry.lastName}`);
      }
    }

    return { status, devoteeId: devotee.DevoteeId };
  } catch (error) {
    console.error('Error processing row:', error);
    return { status: 'Error: Processing Failed', devoteeId: null };
  }
}

async function updateSheetRowStatus(sheetId, rowIndex, { status, devoteeId }) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Sheet1!A${rowIndex}:B${rowIndex}`, // Update Status|text-6 and Devotee ID|text-5
      valueInputOption: 'RAW',
      resource: {
        values: [[status, devoteeId || '']],
      },
    });
    console.log(`Updated row ${rowIndex} with status: "${status}" and devotee ID: "${devoteeId}".`);
  } catch (error) {
    console.error(`Error updating row ${rowIndex}:`, error);
    throw error;
  }
}

processNewSheet();

cron.schedule('0 * * * *', processNewSheet);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// Cp End



// TV Display
const SPREADSHEET_ID_EVENTS = '1lmFLx8asxPv9-iIp7I7sRINcgxvXEYT886P5VnIO6GM';
const RANGE_EVENTS = 'Sheet1!A:C'; // Update range to include the Time column
const SPREADSHEET_ID_PANCHANGA = '1Jd1-udELaOZYH7ZO4TeBDJSHWC0BSTiXutJq_Fotpo4';
const RANGE_PANCHANGA = 'Sheet1!A:H';
const DRIVE_FOLDER_ID = '1NBYfOXyQ7ULNKVD87xd5vdBEXZ2URxPP';

let cachedEvents = [];
let cachedPanchanga = {};
let cachedImages = [];

const resetTime = (date) => {
  date.setHours(0, 0, 0, 0);
  return date;
};

const fetchEvents = async () => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID_EVENTS,
      range: RANGE_EVENTS,
    });

    const rows = response.data.values;
    if (rows.length) {
      const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      today.setHours(0, 0, 0, 0);

      const events = rows
        .slice(1)
        .filter((row) => {
          const eventDate = new Date(new Date(row[0]).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        })
        .slice(0, 8)
        .map((row) => ({
          Date: row[0],
          Time: row[1], // Add Time field
          Event: row[2],
        }));
      cachedEvents = events;
      console.log('Events fetched and cached:', events);
    } else {
      cachedEvents = [];
    }
  } catch (error) {
    await reportError(error);
    console.error('Error fetching data from Google Sheets:', error);
  }
};

const fetchPanchanga = async () => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID_PANCHANGA,
      range: RANGE_PANCHANGA,
    });

    const rows = response.data.values;
    if (rows.length) {
      const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      const panchanga = rows.find((row) => row[0] === todayStr);

      if (panchanga) {
        cachedPanchanga = {
          Date: panchanga[0],
          Samvatsara: panchanga[1],
          DakshinayanaUttarayana: panchanga[2],
          Ritu: panchanga[3],
          Paksha: panchanga[4],
          Tithi: panchanga[5],
          Vaasara: panchanga[6],
          Nakshatra: panchanga[7],
        };
        console.log('Panchanga fetched and cached:', cachedPanchanga);
      } else {
        cachedPanchanga = {};
      }
    }
  } catch (error) {
    await reportError(error);
    console.error('Error fetching Panchanga from Google Sheets:', error);
  }
};

const axios = require('axios');
const DOWNLOAD_DIR = path.join(__dirname, './tvSlideshow');
const DEFAULT_IMAGE = path.join(DOWNLOAD_DIR, './tvSlideshow/sharadamba_backroung.jpg');

const fetchImagesAndVideos = async () => {
  try {
    const response = await drive.files.list({
      q: `'${DRIVE_FOLDER_ID}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
      fields: 'files(id, name)',
    });

    const files = response.data.files;
    if (files.length) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      files.forEach(async (file) => {
        const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
        const extension = file.name.split('.').pop().toLowerCase();
        const validExtensions = ['jpeg', 'jpg', 'png', 'webp', 'mp4', 'avi', 'mov', 'mkv'];

        if (validExtensions.includes(extension)) {
          const [month, day, year] = fileNameWithoutExtension.split('-');
          const fileDate = new Date(year, month - 1, day);

          // Convert fileDate to PST
          const fileDatePST = new Date(fileDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

          if (fileDatePST >= today) {
            const url = `https://drive.google.com/uc?export=view&id=${file.id}`;
            const filePath = path.join(DOWNLOAD_DIR, file.name);

            const writer = fs.createWriteStream(filePath);
            const response = await axios({
              url,
              method: 'GET',
              responseType: 'stream',
            });

            response.data.pipe(writer);

            writer.on('finish', () => {
              console.log(`File downloaded: ${file.name}`);
            });

            writer.on('error', (error) => {
              console.error(`Error downloading file ${file.name}:`, error);
            });
          } else {
            console.log(`Skipping past file: ${file.name}`);
          }
        } else {
          console.log(`Unsupported file format: ${file.name}`);
        }
      });
    }
  } catch (error) {
    await reportError(error);
    console.error('Error fetching files from Google Drive:', error);
  }
};

const sendSareeCollectionReminders = async () => {
  try {
    // Check if saree collection reminders are enabled
    const config = await GeneralConfigurations.findOne({
      where: { configuration: 'sareeCollectRemainder' },
    });

    if (!config || config.value !== '1') {
      console.log('Saree collection reminders are disabled.');
      return;
    }

    // Fetch email credentials
    const emailCredential = await EmailCredential.findOne();
    if (!emailCredential) {
      console.error('Email credentials not found');
      return;
    }

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: emailCredential.email,
        pass: emailCredential.appPassword,
      },
    });

    // Calculate the target date (1 week before today)
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    const formattedDate = oneWeekAgo.toISOString().split('T')[0];

    // Fetch eligible activities
    const activities = await Activity.findAll({
      where: {
        ServiceId: 277,
        ServiceDate: formattedDate,
      },
      include: [
        {
          model: Devotee,
          attributes: ['FirstName', 'Email'],
        },
      ],
    });

    if (activities.length === 0) {
      console.log('No eligible activities found for saree collection reminders.');
      return;
    }

    const bannerImageUrl = 'https://drive.google.com/uc?export=view&id=1YbZwheefs9K-uebzYPsmGYL9IFHteqvS'; // Updated file ID

    // Send email reminders
    for (const activity of activities) {
      const { Devotee, ServiceDate } = activity;
      if (Devotee && Devotee.Email) {
        const email = Devotee.Email;
        const firstName = Devotee.FirstName;

        // Define mail options
        const mailOptions = {
          from: emailCredential.email,
          to: email,
          subject: 'Update: Vastra Sponsor Collection',
          html: `
            <div style="text-align: center;">
              <div style="display: inline-block; border: 3px solid orange; padding: 20px; text-align: left; max-width: 600px;">
                <img src="${bannerImageUrl}" alt="Sharada SEVA Banner" style="width: 100%; max-width: 580px;" />
                <div style="margin-bottom: 20px;"></div>
                <h2 style="color: grey; text-align: center; font-size: 24px;">Vastra Sponsor Collection Reminder</h2>
                <div style="margin-bottom: 20px;"></div>
                <p>Dear ${firstName},</p>
                <p>We are writing to inform you that the Vastra you graciously offered as part of the Vastra Sponsor service is now ready for collection.</p>
                <p>You are welcome to visit the temple at your convenience between <b>6:00 PM and 8:00 PM</b> on any day.</p>
                <p>If you have already collected it, kindly ignore this email.</p>
                <p>Thank you for your kind contribution and devotion. May Sharada Devi bless you and your family with happiness and prosperity.</p>
                <div style="margin-bottom: 20px;"></div>
                <p style="color: grey;">Please visit <a href="https://sharadaseva.org" target="_blank">www.sharadaseva.org</a> for latest updates and upcoming events</p>
                <p style="color: grey;">Contact <a href="tel:+15105651411">(510) 565-1411</a> / <a href="tel:+19256635962">(925) 663-5962)</a> if you have any questions.</p>
                <p style="color: black;">Thank you.<br>SEVA Management</p>
              </div>
            </div>
          `,
        };

        try {
          // Send the email
          await transporter.sendMail(mailOptions);

          // Log success to the EmailLog table
          await EmailLog.create({
            status: 'Sent',
            name: firstName,
            email: email,
            message: 'Vastra Collection Reminder',
            module: 'Vastra Reminder',
          });

          console.log(`Reminder email sent and logged for: ${email}`);
        } catch (error) {
          console.error('Error sending reminder email:', error);

          // Log error to the EmailLog table
          await EmailLog.create({
            status: 'Error',
            name: firstName,
            email: email,
            message: `Error: ${error.message}`,
            module: 'Vastra Reminder',
          });
        }
      } else {
        console.log(`Missing email for devotee with activity ID: ${activity.ActivityId}`);
      }
    }
  } catch (error) {
    console.error('Error in sendSareeCollectionReminders:', error.message);
  }
};

// Schedule the function to run daily at 5 PM
cron.schedule('0 17 * * *', sendSareeCollectionReminders);


// Schedule the fetchImagesAndVideos function to run every 10 minutes
cron.schedule('0 * * * *', fetchImagesAndVideos);

// Fetch images immediately on server start
fetchImagesAndVideos();

// Fetch events, panchanga, and images immediately on server start
fetchEvents();
//fetchPanchanga();

// Set up cron jobs to fetch events and panchanga every 5 minutes
cron.schedule('0 * * * *', fetchEvents);
//cron.schedule('0 * * * *', fetchPanchanga);

app.get('/api/events', (req, res) => {
  res.status(200).json(cachedEvents);
});

app.get('/api/panchanga', (req, res) => {
  res.status(200).json(cachedPanchanga);
});

// Function to check if the date is today or in the future
const isFutureOrToday = (filename) => {
  const fileNameWithoutExtension = filename.split('.').slice(0, -1).join('.');
  const extension = filename.split('.').pop().toLowerCase();

  const validExtensions = ['jpeg', 'jpg', 'png', 'webp', 'mp4', 'avi', 'mov', 'mkv'];
  if (!validExtensions.includes(extension)) return false;

  const [month, day, year] = fileNameWithoutExtension.split('-');
  const fileDate = new Date(year, month - 1, day);

  // Convert fileDate to PST
  const fileDatePST = new Date(fileDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return fileDatePST >= today;
};

app.get('/api/images', (req, res) => {
  fs.readdir(DOWNLOAD_DIR, (err, files) => {
    if (err) {
      console.error('Error reading downloaded images directory:', err);
      return res.status(500).send('Error reading files directory');
    }

    const validExtensions = ['jpeg', 'jpg', 'png', 'webp', 'mp4', 'avi', 'mov', 'mkv'];
    const validFiles = files.filter(file => {
      const extension = file.split('.').pop().toLowerCase();
      return validExtensions.includes(extension) && isFutureOrToday(file);
    });

    let fileUrls = validFiles.map(file => `/api/image/${file}`);

    if (fileUrls.length === 0) {
      // If no valid media, use the default image
      fileUrls = [`/api/image/sharadamba_backroung.jpg`];
    }

    res.status(200).json(fileUrls);
  });
});

app.get('/api/image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(DOWNLOAD_DIR, filename);

  // Check if the file exists before attempting to send it
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return res.status(404).send('File not found');
  }

  // Send the file to the client
  res.sendFile(filePath, (err) => {
    if (err) {
      if (err.code === 'ECONNABORTED') {
        console.warn('Client aborted request:', req.url);
      } else {
        console.error('Error sending image file:', err);
        if (!res.headersSent) {
          res.status(500).send('Error sending image');
        }
      }
    }
  });

  // Handle client abort events
  req.on('aborted', () => {
    console.warn('Client aborted request:', req.url);
  });
});

app.get('/api/today-activities', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const activities = await Activity.findAll({
      where: {
        ServiceDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
      include: [
        { model: Devotee, attributes: ['FirstName', 'LastName'] },
        { model: Service, attributes: ['ServiceId', 'Service'] }
      ]
    });

    res.status(200).json(activities);
  } catch (error) {
    await reportError(error);
    console.error('Error fetching today\'s activities:', error);
    res.status(500).send('Error fetching today\'s activities');
  }
});

// Function to delete TV images
const deleteTvImages = () => {
  const dirPath = path.join(__dirname, './tvSlideshow');
  fs.readdir(dirPath, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      if (file !== 'sharadamba_backroung.jpg') {
        fs.unlink(path.join(dirPath, file), err => {
          if (err) throw err;
        });
      }
    }
  });
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

app.post('/run-gear-functions', async (req, res) => {
  try {
    deleteTvImages();
    await fetchImagesAndVideos();
    await delay(2000);
    await fetchEvents();
    await delay(2000);
    //await fetchPanchanga();
    await delay(2000);
    res.status(200).json({ message: 'Gear functions executed successfully' });
  } catch (error) {
    await reportError(error);
    console.error('Error executing gear functions:', error);
    res.status(500).send('Error executing gear functions');
  }
});

// Tv Display Ends

// Sync the database and create a super user
sequelize.sync().then(async () => {
  const existingSuperUser = await User.findOne({ where: { username: 'aghamya' } });
  if (!existingSuperUser) {
    const hashedPassword = await bcrypt.hash('maya@serenity', 10);
    await User.create({
      username: 'aghamya',
      password: hashedPassword,
      usertype: 'Super Admin',
      email: 'madhu.jan30@gmail.com',
      old_users: 1,
      approved: true,
      approvedBy: 0,
      active: true,
      super_user: true,
      reason_for_access: 'Initial super user',
    });
    console.log('Super user created');
  }

  // Insert default email credentials if not already present
  const existingEmailCredential = await EmailCredential.findOne();
  if (!existingEmailCredential) {
    await EmailCredential.create({
      email: 'chyavanphadke95@gmail.com',  // Replace with your default email
      appPassword: 'dkse hzdh yluv xcvn'      // Replace with your default app password
    });
    console.log('Default email credentials created');
  }

  let emailText = [
    "Thank you for your generous donation to the Sringeri Education and Vedic Academy.",
    "Your donation will greatly help us achieve our goal of creating a modern facility",
    "to support the religious, social, and cultural needs of our community.",
    "May God's blessings always be with you and your family.",
    "Sincerely,",
    "Sringeri Education and Vedic Academy.",
    "No goods or services were provided in exchange for this donation." 
  ];
  
  // Endpoint to get email text
  app.get('/email-text', (req, res) => {
    res.status(200).json(emailText);
  });
  
  // Endpoint to update email text
  app.put('/email-text', (req, res) => {
    emailText = req.body;
    res.status(200).json({ message: 'Email text updated successfully' });
  });
  
  // Endpoint to reset email text
  app.put('/email-text/reset', (req, res) => {
    emailText = [
      "Thank you for your generous donation to the Sringeri Education and Vedic Academy.",
      "Your donation will greatly help us achieve our goal of creating a modern facility",
      "to support the religious, social, and cultural needs of our community.",
      "May God's blessings always be with you and your family.",
      "Sincerely,",
      "Sringeri Education and Vedic Academy.",
      "No goods or services were provided in exchange for this donation."          
    ];
    res.status(200).json({ message: 'Email text reset to default' });
  });



  let ngrokUrl = null;

  setInterval(async () => {
  try {
    const statusConfig = await GeneralConfigurations.findOne({ where: { configuration: 'hostServerStatus' } });
    if (statusConfig?.value !== '1') return;

    const startTimeConfig = await GeneralConfigurations.findOne({ where: { configuration: 'hostServerStartTime' } });
    const stopInConfig = await GeneralConfigurations.findOne({ where: { configuration: 'hostServerStopIn' } });

    const startTime = moment(startTimeConfig?.value);
    const stopInHours = parseInt(stopInConfig?.value || '5', 10);

    if (moment().isAfter(startTime.clone().add(stopInHours, 'hours'))) {
      console.log('Stopping ngrok — auto timeout triggered');
      await ngrok.disconnect();
      await ngrok.kill();
      ngrokUrl = null;

      await GeneralConfigurations.update({ value: '0' }, { where: { configuration: 'hostServerStatus' } });
      await GeneralConfigurations.update({ value: '' }, { where: { configuration: 'hostServerUrl' } });
      await GeneralConfigurations.update({ value: '0' }, { where: { configuration: 'hostServerStartTime' } });
      await GeneralConfigurations.update({ value: '4' }, { where: { configuration: 'hostServerStopIn' } });

    }
  } catch (err) {
    console.error('Auto-stop check failed:', err);
  }
}, 30 * 60 * 1000); // every 30 minutes

app.put('/update-stop-in', async (req, res) => {
  const { hours } = req.body;

  if (isNaN(hours) || hours < 1 || hours > 10) {
    return res.status(400).json({ error: 'Invalid stop time (1–10 hours)' });
  }

  try {
    await GeneralConfigurations.update(
      { value: hours.toString() },
      { where: { configuration: 'hostServerStopIn' } }
    );
    res.json({ message: 'Updated stop time successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stop time' });
  }
});


app.post('/start-ngrok', async (req, res) => {
  try {
    const url = await ngrok.connect({
      addr: 5001,
      authtoken: '2zwrVRsT3Bpyep7vQ62TI0dglj4_3w5zKgV3F2HE2mMgDjztK', // 👈 Just pass it here
      region: 'us'
    });

    console.log('Ngrok tunnel started at:', url);

    // Save config in DB
    await GeneralConfigurations.update({ value: '1' }, { where: { configuration: 'hostServerStatus' } });
    await GeneralConfigurations.update({ value: url }, { where: { configuration: 'hostServerUrl' } });
    await GeneralConfigurations.update({ value: Date.now().toString() }, { where: { configuration: 'hostServerStartTime' } });

    res.json({ message: 'Ngrok started', url });
  } catch (err) {
    console.error('Error starting ngrok:', err);
    res.status(500).json({ error: 'Failed to start ngrok' });
  }
});


app.post('/stop-ngrok', async (req, res) => {
  try {
    await ngrok.disconnect();
    await ngrok.kill();
    ngrokUrl = null;

    // Reset configuration values
    await GeneralConfigurations.update({ value: '0' }, { where: { configuration: 'hostServerStatus' } });
    await GeneralConfigurations.update({ value: '' }, { where: { configuration: 'hostServerUrl' } });
    await GeneralConfigurations.update({ value: '0' }, { where: { configuration: 'hostServerStartTime' } });
    await GeneralConfigurations.update({ value: '4' }, { where: { configuration: 'hostServerStopIn' } });

    res.json({ message: 'Ngrok server stopped and configuration reset' });
  } catch (err) {
    console.error('Error stopping ngrok:', err);
    res.status(500).json({ error: 'Failed to stop ngrok' });
  }
});


app.get('/ngrok-status', async (req, res) => {
  try {
    const statusConfig = await GeneralConfigurations.findOne({ where: { configuration: 'hostServerStatus' } });
    res.json({ status: statusConfig?.value === '1' });
  } catch (error) {
    console.error('Failed to get status:', error);
    res.status(500).json({ error: 'Could not get status' });
  }
});

app.post('/send-ngrok-url', async (req, res) => {
  const { email } = req.body;

  try {
    const emailCredential = await EmailCredential.findOne();
    if (!emailCredential) {
      return res.status(500).send('Email credentials not configured');
    }

    const ngrokUrlConfig = await GeneralConfigurations.findOne({ where: { configuration: 'hostServerUrl' } });
    const ngrokUrl = ngrokUrlConfig?.value || '';

    if (!ngrokUrl) {
      return res.status(400).send('Ngrok URL not found');
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: emailCredential.email,
        pass: emailCredential.appPassword,
      },
    });

    const mailOptions = {
      from: emailCredential.email,
      to: email,
      subject: 'Temporary Server Access Link',
      text: `You can access the temporary server using this link:\n\n${ngrokUrl}\n\nThis link may expire soon.`,
    };

    const info = await transporter.sendMail(mailOptions);

    await EmailLog.create({
      status: 'Sent',
      name: 'Ngrok Server',
      email,
      message: `Sent ngrok URL`,
      module: 'Ngrok Server',
    });

    res.status(200).send(`Ngrok URL sent to ${email}`);
  } catch (error) {
    console.error('Error sending ngrok URL:', error);

    await EmailLog.create({
      status: 'Error',
      name: 'Ngrok Server',
      email,
      message: `Error sending URL: ${error.message}`,
      module: 'Ngrok Server',
    });

    res.status(500).send('Failed to send ngrok URL');
  }
});

app.get('/general-configurations/hostServerUrl', async (req, res) => {
  try {
    const config = await GeneralConfigurations.findOne({ where: { configuration: 'hostServerUrl' } });
    res.json({ value: config?.value || '' });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch hostServerUrl' });
  }
});

app.get('/general-configurations/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const config = await GeneralConfigurations.findOne({ where: { configuration: key } });

    if (!config) {
      return res.status(404).json({ message: `Configuration '${key}' not found` });
    }

    res.json({ value: config.value });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
