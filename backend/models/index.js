const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/config.json');

const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env].database, config[env].username, config[env].password, {
  host: config[env].host,
  dialect: config[env].dialect,
});

// Define User model
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

// Define Devotee model
const Devotee = sequelize.define('Devotee', {
  DevoteeId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  FirstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  LastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  AltPhone: {
    type: DataTypes.STRING,
  },
  Address: {
    type: DataTypes.STRING,
  },
  City: {
    type: DataTypes.STRING,
  },
  State: {
    type: DataTypes.STRING,
  },
  Zip: {
    type: DataTypes.STRING,
  },
  Email: {
    type: DataTypes.STRING,
  },
  Gotra: {
    type: DataTypes.STRING,
  },
  Star: {
    type: DataTypes.STRING,
  },
  Rashi: {
  type: DataTypes.STRING,
  },
  DOB: {
    type: DataTypes.DATE,
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  LastModified: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: false,
  freezeTableName: true
});

// Define Family model
const Family = sequelize.define('Family', {
  FamilyMemberId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  DevoteeId: {
    type: DataTypes.INTEGER,
    references: {
      model: Devotee,
      key: 'DevoteeId'
    }
  },
  FirstName: {
    type: DataTypes.STRING,
  },
  LastName: {
    type: DataTypes.STRING,
  },
  RelationShip: {
    type: DataTypes.STRING,
  },
  Gotra: {
    type: DataTypes.STRING,
  },
  Star: {
    type: DataTypes.STRING,
  },
  Balagokulam: {
    type: DataTypes.STRING,
  },
  DOB: {
    type: DataTypes.DATE,
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  LastModified: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: false,
  freezeTableName: true
});

// Set associations
Devotee.hasMany(Family, { foreignKey: 'DevoteeId' });
Family.belongsTo(Devotee, { foreignKey: 'DevoteeId' });

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
  Devotee,
  Family
};
