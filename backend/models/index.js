const { Sequelize, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'seva@1633',
    database: process.env.DB_NAME || 'seva_new',
    host: process.env.DB_HOST || 'localhost', // Use the Windows host IP if not set
    dialect: 'mysql'
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'seva@1633',
    database: process.env.DB_NAME || 'seva_new',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'seva@1633',
    database: process.env.DB_NAME || 'seva_new',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql'
  }
};

const sequelize = new Sequelize(config[env].database, config[env].username, config[env].password, {
  host: config[env].host,
  dialect: config[env].dialect,
  pool: {
    max: 20,
    min: 0,
    acquire: 60000,
    idle: 10000
  },
  timezone: 'America/Los_Angeles'
});

// Define User model
const User = sequelize.define('User', {
  userid: {
    type: DataTypes.STRING,
    defaultValue: () => uuidv4(),
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
    defaultValue: 'User'
  },
  old_users: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
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
    allowNull: true // Allow null
  },
  AltPhone: {
    type: DataTypes.STRING,
    allowNull: true // Allow null
  },
  Address: {
    type: DataTypes.STRING,
    allowNull: true // Allow null
  },
  City: {
    type: DataTypes.STRING,
    allowNull: true // Allow null
  },
  State: {
    type: DataTypes.STRING,
    allowNull: true // Allow null
  },
  Zip: {
    type: DataTypes.STRING,
    allowNull: true // Allow null
  },
  Email: {
    type: DataTypes.STRING,
    allowNull: true // Allow null
  },
  Gotra: {
    type: DataTypes.STRING,
    allowNull: true // Allow null
  },
  Star: {
    type: DataTypes.STRING,
    allowNull: true // Allow null
  },
  DOB: {
    type: DataTypes.DATE,
    allowNull: true // Allow null
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
  Comment: {
    type: DataTypes.STRING,
  },
  Active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  DisplayFamily: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  Temple: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  SvcCategoryId: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'ServiceCategory',
      key: 'category_id'
    }
  },
  excelSheetLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  time: {
    type: DataTypes.STRING,  // Add the new column here
    allowNull: true
  }
}, {
  timestamps: false,
  freezeTableName: true
});

// Define ServiceCategory model
const ServiceCategory = sequelize.define('ServiceCategory', {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Category_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  Active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  freezeTableName: true,
  timestamps: false
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
    type: DataTypes.INTEGER,
    references: {
      model: ModeOfPayment,
      key: 'PaymentMethodId'
    }
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

// Define Receipt model
const Receipt = sequelize.define('Receipt', {
  receiptid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  servicetype: {
    type: DataTypes.STRING,
    allowNull: false
  },
  activityid: {
    type: DataTypes.INTEGER,
    references: {
      model: Activity,
      key: 'ActivityId'
    }
  },
  approvedby: {
    type: DataTypes.STRING,
    references: {
      model: User,
      key: 'username'
    }
  },
  approvaldate: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  emailsentcount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: false,
  freezeTableName: true
});

const AccessControl = sequelize.define('AccessControl', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usertype: {
    type: DataTypes.STRING,
    allowNull: false
  },
  component: {
    type: DataTypes.STRING,
    allowNull: false
  },
  can_view: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  can_add: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  can_edit: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  can_delete: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  can_approve: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  can_email: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: false,
  freezeTableName: true
});

const EmailCredential = sequelize.define('EmailCredential', {
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  appPassword: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

// Define GeneralConfigurations model
const GeneralConfigurations = sequelize.define('GeneralConfigurations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  configuration: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'generalconfigurations',
  timestamps: false,
});

const EditedReceipts = sequelize.define('EditedReceipts', {
  EditId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ActivityId: { // Add this field
    type: DataTypes.INTEGER,
    references: {
      model: 'Activity', // Name of the target model
      key: 'ActivityId' // Key in the target model that we're referencing
    }
  },
  Name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  OldService: {
    type: DataTypes.STRING,
    allowNull: false
  },
  NewService: {
    type: DataTypes.STRING,
    allowNull: false
  },
  OldAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  NewAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  EditedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  EditedOn: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  }
}, {
  timestamps: false,
  freezeTableName: true
});

// Define the ExcelSevaData model
const ExcelSevaData = sequelize.define('ExcelSevaData', {
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  seva_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  payment_status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  card_details: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sheet_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  devotee_id: {
    type: DataTypes.INTEGER,
  },
  amount: {
    type: DataTypes.DOUBLE
  },
  row_index: {
    type: Sequelize.INTEGER,
  },
  unique_id: {
    type: DataTypes.STRING
  },
  ServiceId: {  // Add this new column
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true, // Add timestamps
});

// Set associations
Devotee.hasMany(Family, { foreignKey: 'DevoteeId' });
Family.belongsTo(Devotee, { foreignKey: 'DevoteeId' });

Devotee.hasMany(Activity, { foreignKey: 'DevoteeId' });
Activity.belongsTo(Devotee, { foreignKey: 'DevoteeId' });

Service.hasMany(Activity, { foreignKey: 'ServiceId' });
Activity.belongsTo(Service, { foreignKey: 'ServiceId' });

ModeOfPayment.hasMany(Activity, { foreignKey: 'PaymentMethod' });
Activity.belongsTo(ModeOfPayment, { foreignKey: 'PaymentMethod' });

User.hasMany(Activity, { foreignKey: 'UserId', as: 'AssistedBy' });
Activity.belongsTo(User, { foreignKey: 'UserId', as: 'AssistedBy' });

Activity.hasOne(Receipt, { foreignKey: 'activityid' });
Receipt.belongsTo(Activity, { foreignKey: 'activityid' });

Service.hasMany(Receipt, { foreignKey: 'servicetype', as: 'ServiceType' });
Receipt.belongsTo(Service, { foreignKey: 'servicetype', as: 'Service' });

ExcelSevaData.belongsTo(Service, { foreignKey: 'ServiceId' });
Service.hasMany(ExcelSevaData, { foreignKey: 'ServiceId' });

Activity.hasMany(EditedReceipts, { foreignKey: 'ActivityId' });
EditedReceipts.belongsTo(Activity, { foreignKey: 'ActivityId' });

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
  ServiceCategory,
  Activity,
  ModeOfPayment,
  Receipt,
  AccessControl,
  EmailCredential,
  GeneralConfigurations,
  EditedReceipts,
  ExcelSevaData
};
