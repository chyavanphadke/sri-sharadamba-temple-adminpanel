const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/config.json');
const { v4: uuidv4 } = require('uuid');
const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env].database, config[env].username, config[env].password, {
  host: config[env].host,
  dialect: config[env].dialect,
});

// Define User model
const User = sequelize.define('User', {
  userid: {
    type: DataTypes.STRING,
    defaultValue: () => uuidv4(), // Automatically generate UUIDs
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
    type: DataTypes.STRING,
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
  DOB: {
    type: DataTypes.DATE,
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
  ModifiedBy: {
    type: DataTypes.STRING,
    references: {
      model: User,
      key: 'userid',
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
  LastModified: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: false,
  freezeTableName: true
});

// Define Service model
const Service = sequelize.define('Service', {
  ServiceId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Service: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Rate: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  Active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: false,
  freezeTableName: true
});

// Define Activity model
const Activity = sequelize.define('Activity', {
  ActivityId: {
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
  ServiceId: {
    type: DataTypes.INTEGER,
    references: {
      model: Service,
      key: 'ServiceId'
    }
  },
  PaymentMethod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  CheckNumber: {
    type: DataTypes.STRING,
  },
  Comments: {
    type: DataTypes.STRING,
  },
  UserId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ActivityDate: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  ServiceDate: {
    type: DataTypes.DATE,
  },
  PrintDate: {
    type: DataTypes.DATE,
  },
  CheckFile: {
    type: DataTypes.STRING,
  }
}, {
  timestamps: false,
  freezeTableName: true
});

// Define ModeOfPayment model
const ModeOfPayment = sequelize.define('ModeOfPayment', {
  PaymentMethodId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  MethodName: {
    type: DataTypes.STRING,
    allowNull: false
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
  Family,
  Service,
  Activity,
  ModeOfPayment
};
