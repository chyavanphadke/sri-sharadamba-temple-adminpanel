const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/config.json');

const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env].database, config[env].username, config[env].password, {
  host: config[env].host,
  dialect: config[env].dialect,
});

// Define User model
const User = sequelize.define('User', {
  userid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  usertype: {
    type: DataTypes.STRING,
    defaultValue: 'User'
  },
  approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  super_user: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reason_for_access: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  freezeTableName: true
});

// Define Contact model
const Contact = sequelize.define('Contact', {
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alternate_phone_number: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
  },
  state: {
    type: DataTypes.STRING,
  },
  zip_code: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  gothra: {
    type: DataTypes.STRING,
  },
  star: {
    type: DataTypes.STRING,
  },
  rashi: {
    type: DataTypes.STRING,
  },
  dob: {
    type: DataTypes.DATE,
  }
});

// Sync the models with the database
sequelize.sync()
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch((error) => {
    console.error('Error creating database & tables:', error);
  });

module.exports = {
  sequelize,
  User,
  Contact
};
