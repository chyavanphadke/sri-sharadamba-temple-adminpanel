# Design Plan

Here are the architectural plans:

<p float="left">
  <img src="Arch/Old_images/20240527_190413.jpg" width="200" />
  <img src="Arch/Old_images/20240527_190423.jpg" width="200" />
  <img src="Arch/Old_images/20240527_190439.jpg" width="200" />
  <img src="Arch/Old_images/20240527_190706.jpg" width="200" />
  <img src="Arch/Old_images/20240527_190407.jpg" width="200" />
  <img src="Arch/Old_images/20240527_190418.jpg" width="200" />
  <img src="Arch/Old_images/20240527_190455.jpg" width="200" />
  <img src="Arch/Old_images/20240527_190459.jpg" width="200" />
  <img src="Arch/Old_images/20240527_190510.jpg" width="200" />
  <img src="Arch/Old_images/20240527_190514.jpg" width="200" />
  <img src="Arch/Old_images/20240530_194554.jpg" width="200" />
  <img src="Arch/Old_images/20240530_194559.jpg" width="200" />
  <img src="Arch/Old_images/20240530_194721.jpg" width="200" />
</p>


# Modify to the DB:
```
ALTER TABLE `seva`.`user` 
ADD COLUMN `approved` BIT(1) NULL AFTER `su`,
ADD COLUMN `approvedBy` VARCHAR(45) NULL AFTER `approved`,
ADD COLUMN `super_user` VARCHAR(45) NULL AFTER `approvedBy`,
ADD COLUMN `reason_for_access` VARCHAR(45) NULL AFTER `super_user`,
ADD COLUMN `old_users` BIT(1) NULL AFTER `reason_for_access`,
ADD COLUMN `createdAt` DATETIME NULL AFTER `old_users`,
ADD COLUMN `updatedAt` DATETIME NULL AFTER `createdAt`,
ADD COLUMN `email` VARCHAR(255) NULL AFTER `updatedAt`,
ADD COLUMN `encryptedPassword` VARCHAR(255) NULL AFTER `email`,
ADD COLUMN `passwordResetToken` VARCHAR(255) NULL AFTER `encryptedPassword`,
ADD COLUMN `passwordResetExpires` DATETIME NULL AFTER `passwordResetToken`,
CHANGE COLUMN `password` `password` VARCHAR(255) NOT NULL DEFAULT '',
CHANGE COLUMN `usertype` `usertype` VARCHAR(50) NOT NULL DEFAULT 'FD';
UPDATE user SET old_users = 1 WHERE userid = 'anilv';
UPDATE user SET old_users = 1 WHERE userid = 'omdhimahi';
UPDATE user SET old_users = 1 WHERE userid = 'sharada';

CREATE TABLE ModeOfPayment (
  PaymentMethodId INT AUTO_INCREMENT PRIMARY KEY,
  MethodName VARCHAR(255) NOT NULL
);

INSERT INTO ModeOfPayment (MethodName) VALUES ('Cash');
INSERT INTO ModeOfPayment (MethodName) VALUES ('Check');
INSERT INTO ModeOfPayment (MethodName) VALUES ('Credit Card');
INSERT INTO ModeOfPayment (MethodName) VALUES ('Debit Card');
INSERT INTO ModeOfPayment (MethodName) VALUES ('Online Transfer');
INSERT INTO ModeOfPayment (MethodName) VALUES ('PayPal');
INSERT INTO ModeOfPayment (MethodName) VALUES ('Zelle');



ALTER TABLE `seva`.`devotee` 
MODIFY `DOB` datetime DEFAULT NULL,
MODIFY `LastModified` datetime DEFAULT NULL;
ALTER TABLE `devotee`
MODIFY `LastModified` datetime DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `devotee`
MODIFY `Phone` varchar(45) DEFAULT NULL,
MODIFY `AltPhone` varchar(45) DEFAULT NULL,
MODIFY `Address` varchar(100) DEFAULT NULL,
MODIFY `City` varchar(45) DEFAULT NULL,
MODIFY `State` varchar(2) DEFAULT NULL,
MODIFY `Zip` varchar(15) DEFAULT NULL,
MODIFY `Email` varchar(100) DEFAULT NULL,
MODIFY `Gotra` varchar(100) DEFAULT NULL,
MODIFY `Star` varchar(100) DEFAULT NULL;



CREATE TABLE `accesscontrol` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usertype` varchar(255) NOT NULL,
  `component` varchar(255) NOT NULL,
  `can_view` int DEFAULT '0',
  `can_add` int DEFAULT '0',
  `can_edit` int DEFAULT '0',
  `can_delete` int DEFAULT '0',
  `can_approve` int DEFAULT '0',
  `can_email` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO accesscontrol (usertype, component, can_view, can_add, can_edit, can_delete, can_approve, can_email) VALUES
('User', 'Home', 1, 1, 0, 0, 2, 2),
('Admin', 'Home', 1, 1, 0, 0, 2, 2),
('Super Admin', 'Home', 1, 1, 1, 1, 2, 2),

('User', 'DevoteeList', 1, 1, 0, 0, 2, 2),
('Admin', 'DevoteeList', 1, 1, 0, 0, 2, 2),
('Super Admin', 'DevoteeList', 1, 1, 1, 1, 2, 2),

('User', 'Calendar', 0, 0, 0, 0, 2, 2),
('Admin', 'Calendar', 1, 2, 0, 2, 2, 2),
('Super Admin', 'Calendar', 1, 2, 1, 2, 2, 2),

('User', 'Receipts', 0, 2, 0, 2, 0, 0),
('Admin', 'Receipts', 1, 2, 0, 2, 1, 1),
('Super Admin', 'Receipts', 1, 2, 1, 2, 1, 1),

('User', 'Reports', 0, 2, 2, 2, 2, 2),
('Admin', 'Reports', 1, 2, 2, 2, 2, 2),
('Super Admin', 'Reports', 1, 2, 2, 2, 2, 2),

('User', 'Login Access', 0, 2, 2, 2, 2, 2),
('Admin', 'Login Access', 0, 2, 2, 2, 2, 2),
('Super Admin', 'Login Access', 1, 2, 2, 2, 2, 2),

('User', 'Settings', 1, 2, 2, 2, 2, 2),
('Admin', 'Settings', 1, 2, 2, 2, 2, 2),
('Super Admin', 'Settings', 1, 2, 2, 2, 2, 2);



ALTER TABLE `seva`.`receipt`;
ALTER TABLE `receipt` ADD COLUMN `emailsentcount` INT DEFAULT 0;
```

# Installation:

## Frontend:
```
npm install
npm install antd @ant-design/icons
npm install react-router-dom
npm install antd axios react-router-dom
npm install jwt-decode
npm install lodash
npm install react-scripts

npm start
```


## Backend:
```
npm install
npm install express body-parser sqlite3
npm install cors
npm install express body-parser bcrypt jsonwebtoken mongoose cors
npm install mysql2
npm install cors

node server.js
```
