## Design Plan

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

## Installation:

# Frontend:
npm install

npm install antd @ant-design/icons

npm install react-router-dom

npm install antd axios react-router-dom

npm install jwt-decode

npm install lodash

npm start


# Backend:
npm install

npm install express body-parser sqlite3

npm install cors

npm install express body-parser bcrypt jsonwebtoken mongoose cors

npm install mysql2

node server.js


## Changed to the DB after importing:


# Modify User Table:

ALTER TABLE `seva`.`user` 
ADD COLUMN `approved` BIT(1) NULL AFTER `su`,
ADD COLUMN `approvedBy` VARCHAR(45) NULL AFTER `approved`,
ADD COLUMN `super_user` VARCHAR(45) NULL AFTER `approvedBy`,
ADD COLUMN `reason_for_access` VARCHAR(45) NULL AFTER `super_user`,
ADD COLUMN `old_users` BIT(1) NULL AFTER `reason_for_access`,
ADD COLUMN `createdAt` DATETIME NULL AFTER `old_users`,
ADD COLUMN `updatedAt` DATETIME NULL AFTER `createdAt`,
CHANGE COLUMN `password` `password` VARCHAR(255) NOT NULL DEFAULT '',
CHANGE COLUMN `usertype` `usertype` VARCHAR(50) NOT NULL DEFAULT 'FD';


# Create ModeOfPayment Table:

CREATE TABLE ModeOfPayment (
  PaymentMethodId INT AUTO_INCREMENT PRIMARY KEY,
  MethodName VARCHAR(255) NOT NULL
);

INSERT INTO ModeOfPayment (MethodName) VALUES ('Cash');
INSERT INTO ModeOfPayment (MethodName) VALUES ('Check');
INSERT INTO ModeOfPayment (MethodName) VALUES ('Credit Card');
INSERT INTO ModeOfPayment (MethodName) VALUES ('Debit Card');
INSERT INTO ModeOfPayment (MethodName) VALUES ('Online Transfer');
