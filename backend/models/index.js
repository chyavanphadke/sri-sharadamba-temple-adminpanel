const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  level: {
    type: DataTypes.STRING,
    defaultValue: 'User'
  },
  approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reason_for_access: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

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

sequelize.sync();

module.exports = {
  sequelize,
  User,
  Contact
};