-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: seva_new
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accesscontrol`
--

DROP TABLE IF EXISTS `accesscontrol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accesscontrol`
--

LOCK TABLES `accesscontrol` WRITE;
/*!40000 ALTER TABLE `accesscontrol` DISABLE KEYS */;
INSERT INTO `accesscontrol` VALUES (19,'User','Home',1,1,1,0,2,2),(20,'Admin','Home',1,1,1,0,2,2),(21,'Super Admin','Home',1,1,1,1,2,2),(22,'User','DevoteeList',1,1,0,0,2,2),(23,'Admin','DevoteeList',1,1,0,0,2,2),(24,'Super Admin','DevoteeList',1,1,1,1,2,2),(25,'User','Calendar',0,0,0,0,2,2),(26,'Admin','Calendar',1,2,0,2,2,2),(27,'Super Admin','Calendar',1,2,1,2,2,2),(28,'User','Receipts',0,2,0,2,0,0),(29,'Admin','Receipts',1,2,0,2,0,1),(30,'Super Admin','Receipts',1,2,1,2,1,1),(31,'User','Reports',0,2,2,2,2,2),(32,'Admin','Reports',0,2,2,2,2,2),(33,'Super Admin','Reports',1,2,2,2,2,2),(34,'User','Login Access',0,2,2,2,2,2),(35,'Admin','Login Access',0,2,2,2,2,2),(36,'Super Admin','Login Access',1,2,2,2,2,2),(37,'User','Settings',1,2,2,2,2,2),(38,'Admin','Settings',1,2,2,2,2,2),(39,'Super Admin','Settings',1,2,2,2,2,2),(40,'Admin','exceldata',1,0,0,0,0,0),(41,'Super Admin','exceldata',1,0,0,0,0,0),(42,'User','exceldata',1,0,0,0,0,0),(43,'User','email-log',0,0,0,0,0,0),(44,'Admin','email-log',1,0,0,0,0,0),(45,'Super Admin','email-log',1,0,0,0,0,0);
/*!40000 ALTER TABLE `accesscontrol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity` (
  `ActivityId` int unsigned NOT NULL AUTO_INCREMENT,
  `DevoteeId` int unsigned NOT NULL DEFAULT '0',
  `ServiceId` int unsigned NOT NULL DEFAULT '0',
  `PaymentMethod` int unsigned NOT NULL DEFAULT '0',
  `Amount` double DEFAULT NULL,
  `CheckNumber` varchar(50) DEFAULT NULL,
  `Comments` varchar(1000) DEFAULT NULL,
  `UserId` varchar(45) NOT NULL DEFAULT '',
  `ActivityDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ServiceDate` datetime DEFAULT NULL,
  `PrintDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `CheckFile` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`ActivityId`),
  KEY `FK_Activity_1` (`ServiceId`),
  KEY `FK_Activity_2` (`UserId`),
  KEY `FK_Activity_3` (`DevoteeId`),
  CONSTRAINT `FK_Activity_1` FOREIGN KEY (`ServiceId`) REFERENCES `service` (`serviceid`),
  CONSTRAINT `FK_Activity_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`userid`),
  CONSTRAINT `FK_Activity_3` FOREIGN KEY (`DevoteeId`) REFERENCES `devotee` (`devoteeid`)
) ENGINE=InnoDB AUTO_INCREMENT=36890 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity`
--

LOCK TABLES `activity` WRITE;
/*!40000 ALTER TABLE `activity` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit`
--

DROP TABLE IF EXISTS `audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit` (
  `DevoteeId` int unsigned NOT NULL DEFAULT '0',
  `AuditDate` datetime DEFAULT NULL,
  `AuditBy` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`DevoteeId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit`
--

LOCK TABLES `audit` WRITE;
/*!40000 ALTER TABLE `audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `CategoryId` int unsigned NOT NULL AUTO_INCREMENT,
  `Category` varchar(45) NOT NULL DEFAULT '',
  PRIMARY KEY (`CategoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devotee`
--

DROP TABLE IF EXISTS `devotee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devotee` (
  `DevoteeId` int unsigned NOT NULL AUTO_INCREMENT,
  `LastName` varchar(60) DEFAULT NULL,
  `FirstName` varchar(60) DEFAULT NULL,
  `Phone` varchar(45) DEFAULT NULL,
  `AltPhone` varchar(45) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Address` varchar(100) DEFAULT NULL,
  `City` varchar(45) DEFAULT NULL,
  `State` varchar(45) DEFAULT NULL,
  `Zip` varchar(15) DEFAULT NULL,
  `MemberTypeId` int unsigned DEFAULT NULL,
  `Comments` varchar(100) DEFAULT NULL,
  `LastModified` datetime DEFAULT CURRENT_TIMESTAMP,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `Gotra` varchar(100) DEFAULT NULL,
  `Star` varchar(100) DEFAULT NULL,
  `MembershipYear` varchar(4) DEFAULT NULL,
  `Active` int unsigned NOT NULL DEFAULT '1',
  `DOB` datetime DEFAULT NULL,
  PRIMARY KEY (`DevoteeId`),
  KEY `FK_devotee_1` (`ModifiedBy`),
  CONSTRAINT `FK_devotee_1` FOREIGN KEY (`ModifiedBy`) REFERENCES `user` (`userid`)
) ENGINE=InnoDB AUTO_INCREMENT=14963 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devotee`
--

LOCK TABLES `devotee` WRITE;
/*!40000 ALTER TABLE `devotee` DISABLE KEYS */;
/*!40000 ALTER TABLE `devotee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editedreceipts`
--

DROP TABLE IF EXISTS `editedreceipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `editedreceipts` (
  `EditId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `OldService` varchar(100) NOT NULL,
  `NewService` varchar(100) NOT NULL,
  `OldAmount` double NOT NULL,
  `NewAmount` double NOT NULL,
  `EditedBy` varchar(100) NOT NULL,
  `EditedOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ActivityId` int DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`EditId`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editedreceipts`
--

LOCK TABLES `editedreceipts` WRITE;
/*!40000 ALTER TABLE `editedreceipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `editedreceipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emailcredentials`
--

DROP TABLE IF EXISTS `emailcredentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emailcredentials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `appPassword` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emailcredentials`
--

LOCK TABLES `emailcredentials` WRITE;
/*!40000 ALTER TABLE `emailcredentials` DISABLE KEYS */;
INSERT INTO `emailcredentials` VALUES (1,'srisharadasevaoffice@gmail.com','testing','2024-06-19 00:19:47','2025-02-27 12:44:08');
/*!40000 ALTER TABLE `emailcredentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emaillog`
--

DROP TABLE IF EXISTS `emaillog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emaillog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` varchar(10) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `message` text,
  `log_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `module` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=188 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emaillog`
--

LOCK TABLES `emaillog` WRITE;
/*!40000 ALTER TABLE `emaillog` DISABLE KEYS */;
/*!40000 ALTER TABLE `emaillog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `excelsevadata`
--

DROP TABLE IF EXISTS `excelsevadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `excelsevadata` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seva_id` varchar(45) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `date` varchar(255) DEFAULT NULL,
  `message` text,
  `payment_status` varchar(255) DEFAULT NULL,
  `card_details` text,
  `sheet_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `devotee_id` int DEFAULT NULL,
  `amount` double DEFAULT NULL,
  `row_index` int DEFAULT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `ServiceId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=924 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `excelsevadata`
--

LOCK TABLES `excelsevadata` WRITE;
/*!40000 ALTER TABLE `excelsevadata` DISABLE KEYS */;
/*!40000 ALTER TABLE `excelsevadata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `excelsevadata_old`
--

DROP TABLE IF EXISTS `excelsevadata_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `excelsevadata_old` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seva_id` varchar(45) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `message` text,
  `payment_status` varchar(255) DEFAULT NULL,
  `card_details` text,
  `sheet_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `devotee_id` int DEFAULT NULL,
  `amount` double DEFAULT NULL,
  `row_index` int DEFAULT NULL,
  `unique_id` varchar(255) DEFAULT NULL,
  `ServiceId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=262 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `excelsevadata_old`
--

LOCK TABLES `excelsevadata_old` WRITE;
/*!40000 ALTER TABLE `excelsevadata_old` DISABLE KEYS */;
/*!40000 ALTER TABLE `excelsevadata_old` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family`
--

DROP TABLE IF EXISTS `family`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `family` (
  `FamilyMemberId` int unsigned NOT NULL AUTO_INCREMENT,
  `DevoteeId` int unsigned NOT NULL DEFAULT '0',
  `LastName` varchar(45) DEFAULT NULL,
  `FirstName` varchar(45) DEFAULT NULL,
  `Gotra` varchar(45) DEFAULT NULL,
  `Star` varchar(45) DEFAULT NULL,
  `Gender` char(1) DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `LastModified` datetime DEFAULT NULL,
  `ModifiedBy` varchar(50) NOT NULL DEFAULT '',
  `RelationShip` varchar(45) NOT NULL DEFAULT '',
  `Balagokulam` varchar(45) NOT NULL DEFAULT '',
  PRIMARY KEY (`FamilyMemberId`),
  KEY `FK_Family_1` (`DevoteeId`),
  KEY `FK_Family_2` (`ModifiedBy`),
  CONSTRAINT `FK_Family_1` FOREIGN KEY (`DevoteeId`) REFERENCES `devotee` (`DevoteeId`),
  CONSTRAINT `FK_Family_2` FOREIGN KEY (`ModifiedBy`) REFERENCES `user` (`userid`)
) ENGINE=InnoDB AUTO_INCREMENT=20411 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family`
--

LOCK TABLES `family` WRITE;
/*!40000 ALTER TABLE `family` DISABLE KEYS */;
/*!40000 ALTER TABLE `family` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fundraising`
--

DROP TABLE IF EXISTS `fundraising`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fundraising` (
  `idfundraising` int NOT NULL AUTO_INCREMENT,
  `devoteeid` int NOT NULL,
  `devoteename` varchar(100) DEFAULT NULL,
  `amount` double DEFAULT '0',
  `printed` int DEFAULT '0',
  PRIMARY KEY (`idfundraising`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fundraising`
--

LOCK TABLES `fundraising` WRITE;
/*!40000 ALTER TABLE `fundraising` DISABLE KEYS */;
/*!40000 ALTER TABLE `fundraising` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `generalconfigurations`
--

DROP TABLE IF EXISTS `generalconfigurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `generalconfigurations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `configuration` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `generalconfigurations`
--

LOCK TABLES `generalconfigurations` WRITE;
/*!40000 ALTER TABLE `generalconfigurations` DISABLE KEYS */;
INSERT INTO `generalconfigurations` VALUES (4,'autoApprove','0'),(5,'excelSevaEmailConformation','0'),(6,'errorreport','0'),(7,'sareeCollectRemainder','0');
/*!40000 ALTER TABLE `generalconfigurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item` (
  `ItemId` int unsigned NOT NULL AUTO_INCREMENT,
  `Item` varchar(45) NOT NULL DEFAULT '',
  `CategoryId` int unsigned DEFAULT NULL,
  `Comment` varchar(100) DEFAULT NULL,
  `LocationId` int unsigned DEFAULT NULL,
  `InventoryCode` varchar(45) DEFAULT NULL,
  `Quantity` int unsigned DEFAULT NULL,
  PRIMARY KEY (`ItemId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemstatus`
--

DROP TABLE IF EXISTS `itemstatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itemstatus` (
  `StatusId` int unsigned NOT NULL AUTO_INCREMENT,
  `Status` varchar(45) NOT NULL DEFAULT '',
  PRIMARY KEY (`StatusId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemstatus`
--

LOCK TABLES `itemstatus` WRITE;
/*!40000 ALTER TABLE `itemstatus` DISABLE KEYS */;
/*!40000 ALTER TABLE `itemstatus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lineitem`
--

DROP TABLE IF EXISTS `lineitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lineitem` (
  `LineItemId` int unsigned NOT NULL AUTO_INCREMENT,
  `ItemId` int unsigned NOT NULL DEFAULT '0',
  `StatusId` varchar(45) NOT NULL DEFAULT '',
  `ConditionId` varchar(45) NOT NULL DEFAULT '',
  `Comment` varchar(45) DEFAULT NULL,
  `CheckedOutBy` varchar(100) DEFAULT NULL,
  `CheckOutDate` datetime DEFAULT NULL,
  PRIMARY KEY (`LineItemId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lineitem`
--

LOCK TABLES `lineitem` WRITE;
/*!40000 ALTER TABLE `lineitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `lineitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location`
--

DROP TABLE IF EXISTS `location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location` (
  `LocationId` int unsigned NOT NULL AUTO_INCREMENT,
  `Location` varchar(45) NOT NULL DEFAULT '',
  PRIMARY KEY (`LocationId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location`
--

LOCK TABLES `location` WRITE;
/*!40000 ALTER TABLE `location` DISABLE KEYS */;
/*!40000 ALTER TABLE `location` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member`
--

DROP TABLE IF EXISTS `member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member` (
  `MemberId` int unsigned NOT NULL AUTO_INCREMENT,
  `DevoteeId` int unsigned NOT NULL DEFAULT '0',
  `MemberType` varchar(3) NOT NULL DEFAULT '',
  `LastPayment` double DEFAULT NULL,
  `LastPaymentDate` datetime DEFAULT NULL,
  `LastModified` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `UserId` varchar(45) NOT NULL DEFAULT '',
  PRIMARY KEY (`MemberId`),
  KEY `FK_Member_1` (`DevoteeId`),
  KEY `FK_Member_2` (`UserId`),
  CONSTRAINT `FK_Member_1` FOREIGN KEY (`DevoteeId`) REFERENCES `devotee` (`DevoteeId`),
  CONSTRAINT `FK_Member_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member`
--

LOCK TABLES `member` WRITE;
/*!40000 ALTER TABLE `member` DISABLE KEYS */;
/*!40000 ALTER TABLE `member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membership`
--

DROP TABLE IF EXISTS `membership`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membership` (
  `MembershipId` int unsigned NOT NULL AUTO_INCREMENT,
  `DevoteeId` int unsigned NOT NULL DEFAULT '0',
  `MemberTypeId` varchar(3) NOT NULL DEFAULT '',
  `Amount` double DEFAULT NULL,
  `MembershipYear` varchar(4) DEFAULT NULL,
  `DateTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `UserId` varchar(45) NOT NULL DEFAULT '',
  `PaymentMethod` int unsigned DEFAULT NULL,
  `CheckNumber` varchar(45) DEFAULT NULL,
  `Comments` varchar(100) NOT NULL DEFAULT '',
  `PrintDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`MembershipId`),
  KEY `FK_Member_1` (`DevoteeId`),
  KEY `FK_Member_2` (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membership`
--

LOCK TABLES `membership` WRITE;
/*!40000 ALTER TABLE `membership` DISABLE KEYS */;
/*!40000 ALTER TABLE `membership` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membertype`
--

DROP TABLE IF EXISTS `membertype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membertype` (
  `MemberTypeId` int unsigned NOT NULL AUTO_INCREMENT,
  `MemberType` varchar(50) NOT NULL DEFAULT '',
  `Rate` double DEFAULT NULL,
  `Comment` varchar(45) DEFAULT NULL,
  `Active` bit(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`MemberTypeId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membertype`
--

LOCK TABLES `membertype` WRITE;
/*!40000 ALTER TABLE `membertype` DISABLE KEYS */;
/*!40000 ALTER TABLE `membertype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchandise`
--

DROP TABLE IF EXISTS `merchandise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchandise` (
  `ItemId` int unsigned NOT NULL AUTO_INCREMENT,
  `Item` varchar(100) NOT NULL DEFAULT '',
  `Price` double NOT NULL DEFAULT '0',
  `Comment` varchar(100) NOT NULL DEFAULT '',
  `Active` bit(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`ItemId`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchandise`
--

LOCK TABLES `merchandise` WRITE;
/*!40000 ALTER TABLE `merchandise` DISABLE KEYS */;
/*!40000 ALTER TABLE `merchandise` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modeofpayment`
--

DROP TABLE IF EXISTS `modeofpayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modeofpayment` (
  `PaymentMethodId` int NOT NULL AUTO_INCREMENT,
  `MethodName` varchar(255) NOT NULL,
  PRIMARY KEY (`PaymentMethodId`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modeofpayment`
--

LOCK TABLES `modeofpayment` WRITE;
/*!40000 ALTER TABLE `modeofpayment` DISABLE KEYS */;
INSERT INTO `modeofpayment` VALUES (1,'Cash'),(2,'Check'),(3,'Credit Card'),(4,'Debit Card'),(5,'Online Transfer'),(6,'PayPal'),(7,'Zelle'),(8,'Benevity'),(9,'Paid via Website'),(10,'Kind'),(11,'Paid at Temple'),(12,'Paid Online');
/*!40000 ALTER TABLE `modeofpayment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pledge`
--

DROP TABLE IF EXISTS `pledge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pledge` (
  `PledgeId` int unsigned NOT NULL AUTO_INCREMENT,
  `DevoteeId` int unsigned NOT NULL DEFAULT '0',
  `PledgeType` varchar(100) NOT NULL DEFAULT '',
  `PledgeAmount` double NOT NULL DEFAULT '0',
  `PledgeDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `UserId` varchar(50) NOT NULL DEFAULT '',
  `Comments` varchar(200) NOT NULL DEFAULT '',
  `PledgeCompletionDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `CreateDate` datetime DEFAULT NULL,
  PRIMARY KEY (`PledgeId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pledge`
--

LOCK TABLES `pledge` WRITE;
/*!40000 ALTER TABLE `pledge` DISABLE KEYS */;
/*!40000 ALTER TABLE `pledge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pledgedonation`
--

DROP TABLE IF EXISTS `pledgedonation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pledgedonation` (
  `PledgeDonationId` int unsigned NOT NULL AUTO_INCREMENT,
  `PledgeId` int unsigned NOT NULL DEFAULT '0',
  `DevoteeId` int unsigned NOT NULL DEFAULT '0',
  `PayMethod` int unsigned NOT NULL DEFAULT '0',
  `CheckNumber` varchar(50) NOT NULL DEFAULT '',
  `UserId` varchar(50) NOT NULL DEFAULT '',
  `DonationDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `Comments` varchar(200) NOT NULL DEFAULT '',
  `Amount` double NOT NULL DEFAULT '0',
  PRIMARY KEY (`PledgeDonationId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pledgedonation`
--

LOCK TABLES `pledgedonation` WRITE;
/*!40000 ALTER TABLE `pledgedonation` DISABLE KEYS */;
/*!40000 ALTER TABLE `pledgedonation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `priest`
--

DROP TABLE IF EXISTS `priest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `priest` (
  `PriestId` int unsigned NOT NULL AUTO_INCREMENT,
  `PriestName` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`PriestId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `priest`
--

LOCK TABLES `priest` WRITE;
/*!40000 ALTER TABLE `priest` DISABLE KEYS */;
/*!40000 ALTER TABLE `priest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qbdata`
--

DROP TABLE IF EXISTS `qbdata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qbdata` (
  `idqbdata` int NOT NULL AUTO_INCREMENT,
  `cust` varchar(100) DEFAULT NULL,
  `num` varchar(45) DEFAULT NULL,
  `memo` varchar(200) DEFAULT NULL,
  `account` varchar(45) DEFAULT NULL,
  `class` varchar(100) DEFAULT NULL,
  `amt` double DEFAULT NULL,
  `serviceid` int DEFAULT NULL,
  `devoteeid` int DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  PRIMARY KEY (`idqbdata`)
) ENGINE=InnoDB AUTO_INCREMENT=7495 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qbdata`
--

LOCK TABLES `qbdata` WRITE;
/*!40000 ALTER TABLE `qbdata` DISABLE KEYS */;
/*!40000 ALTER TABLE `qbdata` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipt`
--

DROP TABLE IF EXISTS `receipt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipt` (
  `receiptid` int NOT NULL AUTO_INCREMENT,
  `servicetype` varchar(45) DEFAULT NULL,
  `activityid` int NOT NULL,
  `approvedby` varchar(50) DEFAULT NULL,
  `approvaldate` datetime DEFAULT NULL,
  `emailsentcount` int DEFAULT '0',
  PRIMARY KEY (`receiptid`)
) ENGINE=InnoDB AUTO_INCREMENT=4838 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt`
--

LOCK TABLES `receipt` WRITE;
/*!40000 ALTER TABLE `receipt` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale`
--

DROP TABLE IF EXISTS `sale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale` (
  `SaleId` int unsigned NOT NULL AUTO_INCREMENT,
  `ItemId` int unsigned NOT NULL DEFAULT '0',
  `Quantity` double NOT NULL DEFAULT '0',
  `Amount` double NOT NULL DEFAULT '0',
  `UserId` varchar(45) NOT NULL DEFAULT '',
  `SaleDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `Comments` varchar(100) DEFAULT NULL,
  `PaymentMethod` int unsigned NOT NULL DEFAULT '0',
  `CheckNumber` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`SaleId`),
  KEY `FK_Sale_1` (`ItemId`),
  KEY `FK_Sale_2` (`UserId`),
  CONSTRAINT `FK_Sale_1` FOREIGN KEY (`ItemId`) REFERENCES `merchandise` (`ItemId`),
  CONSTRAINT `FK_Sale_2` FOREIGN KEY (`UserId`) REFERENCES `user` (`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale`
--

LOCK TABLES `sale` WRITE;
/*!40000 ALTER TABLE `sale` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedule`
--

DROP TABLE IF EXISTS `schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule` (
  `ScheduleId` int unsigned NOT NULL AUTO_INCREMENT,
  `DevoteeId` int unsigned NOT NULL DEFAULT '0',
  `EntryDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `EnteredBy` varchar(20) NOT NULL DEFAULT '',
  `PriestId` int unsigned DEFAULT NULL,
  `Status` int unsigned NOT NULL DEFAULT '0',
  `ActivityId` int unsigned DEFAULT NULL,
  `Comments` varchar(500) NOT NULL DEFAULT '',
  `ServiceLocationId` int unsigned DEFAULT NULL,
  `StartDateTime` datetime DEFAULT NULL,
  `EndDateTime` datetime DEFAULT NULL,
  PRIMARY KEY (`ScheduleId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedule`
--

LOCK TABLES `schedule` WRITE;
/*!40000 ALTER TABLE `schedule` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service`
--

DROP TABLE IF EXISTS `service`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service` (
  `ServiceId` int unsigned NOT NULL AUTO_INCREMENT,
  `Service` varchar(100) NOT NULL DEFAULT '',
  `Rate` double NOT NULL DEFAULT '0',
  `Comment` varchar(100) NOT NULL DEFAULT '',
  `Active` bit(1) NOT NULL DEFAULT b'1',
  `DisplayFamily` bit(1) NOT NULL DEFAULT b'0',
  `Temple` int unsigned NOT NULL DEFAULT '0',
  `SvcCategoryId` int DEFAULT NULL,
  `excelSheetLink` varchar(255) DEFAULT NULL,
  `category_id` int unsigned DEFAULT NULL,
  `time` time DEFAULT NULL,
  PRIMARY KEY (`ServiceId`)
) ENGINE=InnoDB AUTO_INCREMENT=328 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service`
--

LOCK TABLES `service` WRITE;
/*!40000 ALTER TABLE `service` DISABLE KEYS */;
INSERT INTO `service` VALUES (2,'DONATION',0,'',_binary '',_binary '',0,3,NULL,1,'18:00:00'),(3,'KIND',0,'',_binary '',_binary '',0,3,NULL,1,'18:00:00'),(268,'Archana',11,'',_binary '',_binary '',0,3,NULL,1,'18:00:00'),(269,'Annadanam (Saturday)',251,'',_binary '',_binary '',1,4,'1SBreZNZX4wYViXwvW3IswUamwkgkckPK-ZXjsi6BlU4',1,'18:00:00'),(270,'Rathotsava Seva',101,'',_binary '',_binary '',1,3,'16A2Lo0FmRiRBTdch8sB0UyJZlYv85oVANklAgatFTRQ',1,'18:00:00'),(271,'Mahaposhaka',10001,'',_binary '\0',_binary '',1,5,NULL,2,'18:00:00'),(272,'Pradhana Yajamana',5001,'',_binary '\0',_binary '',1,5,NULL,2,NULL),(273,'Gana Yajamana',2001,'',_binary '\0',_binary '',1,5,NULL,2,NULL),(274,'Maharudram 1 Day Sponsor',1001,'',_binary '\0',_binary '',1,3,NULL,2,NULL),(275,'Rudrabhisheka & Kramarchana',501,'',_binary '\0',_binary '',1,5,NULL,2,NULL),(276,'Kalyanotsavam',251,'',_binary '',_binary '',1,5,NULL,1,NULL),(277,'Vastra Sponsor',0,'',_binary '',_binary '',1,3,'1fcdLPi-d6CFpnHZXL0ccWuXv-_FgXM-3-YZI92awuOc',1,'18:00:00'),(278,'Flower Sponsor',0,'',_binary '',_binary '',1,3,NULL,1,'18:00:00'),(279,'Satyanarayana Pooja',51,'',_binary '',_binary '',1,3,'1RkYNyuYKL5-w6jyZU6gV5_hPUqGQZSpI4jx5-k_JldM',1,'18:00:00'),(280,'Pradosha Pooja',51,'',_binary '',_binary '',1,3,'1PozePRRuSdileZroTCgZo-BDEhj0auXUgjDLA_uDvVI',1,'18:00:00'),(281,'Sankata Hara Chaturthi',51,'',_binary '',_binary '',1,3,'1_ze8hxIU_anFUZ4w2qsicU80DkxizuMW6KAciGt85eM',1,'18:00:00'),(282,'Sarva Seva ',501,'',_binary '',_binary '',1,3,NULL,1,NULL),(284,'Nitya Seva',375,'Added',_binary '',_binary '\0',1,3,'https://docs.google.com/spreadsheets/d/1CLQKsHaV1HyOfWJCdqfMQchFlQzLVCOmnDN24D-N0Cs/edit?gid=0#gid=0',1,'18:00:00'),(285,'Upakarma',21,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/1X7Yi9AqmVpSbNizvd37DbRAZdP70y7pHky9DA9JPd0E/edit?gid=0#gid=0',12,'07:00:00'),(286,'Varamahalaxmi Pooja',51,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/19tRI4Q6AAddj68W3qVln_3wt_cPEe-VbN9_zxiBGBZ4/edit?gid=0#gid=0',12,'18:00:00'),(287,'Vahana Pooja (Car Pooja) ',0,'',_binary '',_binary '\0',0,3,NULL,1,'18:00:00'),(288,'BTS Saraswathi Pooja',51,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/1Ijr2GRHsvlrTbNM4x7atZcC2iBB6hCJl10RdK9v79Zw/edit?usp=sharing',12,'18:00:00'),(289,'Chandi Homa',101,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/13tdSVDDAISR-lv9mxQS9jrezVBkGNuj0SkzWGpIuWsI/edit?gid=0#gid=0',6,'05:00:00'),(290,'Durga Homa',101,'',_binary '\0',_binary '\0',0,3,NULL,6,'06:00:00'),(291,'SarvaSeva',1001,'',_binary '\0',_binary '\0',0,3,NULL,6,'18:00:00'),(292,'Pushpa Alankaram',151,'',_binary '\0',_binary '\0',0,3,NULL,6,'18:30:00'),(293,'Sumangali-Puja',151,'',_binary '\0',_binary '\0',0,3,NULL,6,'18:30:00'),(294,'Kumari-Puja',151,'',_binary '\0',_binary '\0',0,3,NULL,6,'18:00:00'),(295,'General-Donation',101,'',_binary '\0',_binary '\0',0,3,NULL,6,'18:00:00'),(296,'Saraswati Puja',51,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/1wfcRnTZleIasizsKbz03uTcVPmciUK9KaSJbDnUZN2g/edit?gid=0#gid=0',6,'18:30:00'),(297,'Ambal Abishekam',101,'',_binary '',_binary '\0',0,3,NULL,7,'17:00:00'),(298,'Ambal Vastram',201,'',_binary '',_binary '\0',0,3,NULL,7,'17:00:00'),(299,'Pushpa Alankaram',151,'',_binary '',_binary '\0',0,3,NULL,7,'17:00:00'),(300,'Annadhanam',251,'',_binary '',_binary '\0',0,3,NULL,7,'17:00:00'),(301,'Ambal Archana',21,'',_binary '',_binary '\0',0,3,NULL,7,'17:00:00'),(302,'Kumkumarchana',51,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/1lYKSQvEuw5kNVRyoBhFPf5bjoMkzwUc5lAiU1jx9T_8/edit?gid=0#gid=0',6,'18:00:00'),(303,'aksharabyasam',51,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/1qTFb1BxWHPYcr-Yhj2lmWMTicXeShrfNBFd6Nv5NON8/edit?gid=0#gid=0',6,'18:30:00'),(304,'Bagavathy Seva',201,'',_binary '',_binary '\0',0,3,NULL,8,'17:00:00'),(305,'Deepa-Puja',51,'',_binary '',_binary '\0',0,3,NULL,8,'17:00:00'),(306,'Lakshmipuja',51,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/1ktzNjnjUFp6bmvLyAaKQ9T14cyVMMk5ktWbUjN4XUYI/edit?gid=0#gid=0',9,'18:30:00'),(307,'Karthika Somavara Abishekam',51,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/17cf2IA9Pu0O0iG_V_6h55WcypwiY74EiKwMtKCd3uhA/edit?gid=0#gid=0',10,'18:30:00'),(308,'New Year Ganapathi Homam',51,'',_binary '\0',_binary '\0',0,3,'https://docs.google.com/spreadsheets/d/1yA692GAlm3hdXW-_65g6mmK0wRUH2NijUrLZ5UZxo38/edit?pli=1&gid=0#gid=0',11,'08:30:00'),(309,'Vaikunta Ekadashi',51,'',_binary '\0',_binary '\0',0,3,'',12,'09:00:00'),(310,'Swami Abhishekam',51,'',_binary '\0',_binary '\0',0,3,'',13,'09:00:00'),(311,'Archana',21,'',_binary '\0',_binary '\0',0,3,'',13,'12:30:00'),(312,'Annadhana Seva',251,'',_binary '\0',_binary '\0',0,3,'',13,'13:30:00'),(313,'Vastra Seva',151,'',_binary '\0',_binary '\0',0,3,NULL,13,'09:30:00'),(314,'Ambal Vigraham Sponsor',2501,'',_binary '',_binary '\0',0,3,NULL,14,'10:00:00'),(315,'Ambal-Prabhavali',2001,'',_binary '',_binary '\0',0,3,NULL,14,'10:30:00'),(316,'Ambal-Mangalyam',1001,'',_binary '',_binary '\0',0,3,NULL,14,'12:30:00'),(317,'Annadhana Seva',251,'',_binary '',_binary '\0',0,3,NULL,14,'19:40:00'),(318,'Vastra-Seva',151,'',_binary '',_binary '\0',0,3,NULL,14,'12:30:00'),(319,'Archana',21,'',_binary '',_binary '\0',0,3,NULL,14,'17:30:00'),(320,'Saraswathi-Puja',51,'',_binary '',_binary '\0',0,3,NULL,14,'17:30:00'),(321,'Abhishekam',51,'',_binary '',_binary '\0',0,3,NULL,14,'11:30:00'),(322,'Rathotsavam',101,'',_binary '',_binary '\0',0,3,NULL,14,'18:30:00'),(323,'Aruna Parayanam / Surya Namaskaram',51,'',_binary '',_binary '\0',0,3,NULL,12,'06:00:00'),(324,'Mahaprasadam',251,'',_binary '',_binary '\0',0,3,NULL,16,'05:30:00'),(325,'Rudrabhishekam',101,'',_binary '',_binary '\0',0,3,NULL,16,'05:30:00'),(326,'Bilwarchana',51,'',_binary '',_binary '\0',0,3,NULL,16,'10:30:00'),(327,'Mahashivaratri Sponsor',501,'',_binary '',_binary '\0',0,3,NULL,16,'06:00:00');
/*!40000 ALTER TABLE `service` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicecategory`
--

DROP TABLE IF EXISTS `servicecategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicecategory` (
  `category_id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `excelSheetLink` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicecategory`
--

LOCK TABLES `servicecategory` WRITE;
/*!40000 ALTER TABLE `servicecategory` DISABLE KEYS */;
INSERT INTO `servicecategory` VALUES (1,'General',1,NULL),(2,'Maharudra',1,NULL),(6,'Navaratri',0,'https://docs.google.com/spreadsheets/d/1QhSNQobEBLXWTw1s4uxzqoxh-2jTnL7ti3cNYrLKFwk/edit?gid=0#gid=0'),(7,'AMBALABISHEKAM',0,'https://docs.google.com/spreadsheets/d/1anCU1LMqCqbq-0TelihS7OsjIQIrFivBthP3h2iz0_I/edit?gid=0#gid=0'),(8,'Bagavathy',0,'https://docs.google.com/spreadsheets/d/1bq7lJrbZ0-LV_LaqF2-66yTLN37RsHYTrMBMeYy8pko/edit?gid=0#gid=0'),(9,'Deepavali',0,NULL),(10,'Karthik',0,NULL),(11,'New Year - 2025',0,''),(12,'Special Events',1,NULL),(13,'Vaikunta Ekadashi',0,'https://docs.google.com/spreadsheets/d/1_1Ud0GhO8GNSzkTALyMMU0ZxY8DPqnG-1jm632Bq_2k/edit?gid=0#gid=0'),(14,'Vasantha Panchami',1,'https://docs.google.com/spreadsheets/d/1okSFm2LrOHTRhLaYwgQvrDMcvL6VvSXM5tH5B4E2Lhk/edit?gid=0#gid=0'),(15,'Vasavtha Panchami',1,NULL),(16,'Mahashivaratri',1,'https://docs.google.com/spreadsheets/d/1hfNWHUqq9V-jdrhNAjoccFOPAES5q6Fc2Gbd36o8evs/edit?gid=0#gid=0');
/*!40000 ALTER TABLE `servicecategory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicelocation`
--

DROP TABLE IF EXISTS `servicelocation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicelocation` (
  `ServiceLocationId` int unsigned NOT NULL AUTO_INCREMENT,
  `ServiceLocation` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`ServiceLocationId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicelocation`
--

LOCK TABLES `servicelocation` WRITE;
/*!40000 ALTER TABLE `servicelocation` DISABLE KEYS */;
/*!40000 ALTER TABLE `servicelocation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stmtlist`
--

DROP TABLE IF EXISTS `stmtlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stmtlist` (
  `DevoteeId` int unsigned NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(100) NOT NULL DEFAULT '',
  `LastName` varchar(100) NOT NULL DEFAULT '',
  `Amt` double NOT NULL DEFAULT '0',
  `PrintDate` datetime DEFAULT NULL,
  PRIMARY KEY (`DevoteeId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stmtlist`
--

LOCK TABLES `stmtlist` WRITE;
/*!40000 ALTER TABLE `stmtlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `stmtlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `svccategory`
--

DROP TABLE IF EXISTS `svccategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `svccategory` (
  `SvcCategoryId` mediumint NOT NULL AUTO_INCREMENT,
  `Name` varchar(200) NOT NULL,
  PRIMARY KEY (`SvcCategoryId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `svccategory`
--

LOCK TABLES `svccategory` WRITE;
/*!40000 ALTER TABLE `svccategory` DISABLE KEYS */;
INSERT INTO `svccategory` VALUES (3,'DONATION'),(4,'Annadan'),(5,'Maharudram');
/*!40000 ALTER TABLE `svccategory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `userid` varchar(255) NOT NULL DEFAULT '',
  `username` varchar(255) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `active` bit(1) NOT NULL DEFAULT b'1',
  `usertype` varchar(50) NOT NULL DEFAULT 'FD',
  `su` int unsigned NOT NULL DEFAULT '0',
  `approved` bit(1) DEFAULT NULL,
  `approvedBy` varchar(45) DEFAULT NULL,
  `super_user` varchar(45) DEFAULT NULL,
  `reason_for_access` varchar(45) DEFAULT NULL,
  `old_users` int DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `encryptedPassword` varchar(255) DEFAULT NULL,
  `passwordResetToken` varchar(255) DEFAULT NULL,
  `passwordResetExpires` datetime DEFAULT NULL,
  PRIMARY KEY (`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('07a5a4b5-b1ca-4f8c-b67f-40c9b0ce110e','nb','$2a$10$1zvppHps1REtzf/afiN.wO4xZwzi/kcBEaaeJcL0dEeLtmqa4cWXy',_binary '','Super Admin',0,_binary '','9a64e1bd-3fe3-4912-92fa-a8a5d01106e1','0','User',0,'2024-06-19 00:40:30','2024-12-07 20:30:01','namysuree@gmail.com',NULL,NULL,NULL),('17855d3a-6eec-4c3d-810e-b6972b62d8ee','sai','$2a$10$kH3ev7LuFPLaau2AiWT5ruTIuaPseEn3rbeXdF32WGuKVBfWB7pNG',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2024-10-09 18:42:20','2024-10-09 18:42:20','sai@seva.com',NULL,NULL,NULL),('1ef38957-b80a-4766-9bec-12681a6c80e5','aishwaryamuralidhar','$2b$10$gOwyFCB/VZ0v4m1GTdfyKe1BgNJo9KiigUFItOs2zPCmFYaijRBIu',_binary '','User',0,_binary '','9a64e1bd-3fe3-4912-92fa-a8a5d01106e1','0','User',0,'2024-06-22 17:14:43','2024-06-22 17:20:19','aishwaryamuralidhar104@gmail.com',NULL,NULL,NULL),('24af56ac-205b-4e6c-909f-5448da425697','aghamya','$2b$10$Miq0fpN3SPVAqJy.J.CKD.Z50lPIzJIesn9JuKsdy7zPbFZanQRqW',_binary '','Super Admin',0,_binary '','0','1','Initial super user',1,'2024-06-19 00:19:47','2024-06-19 00:19:47','madhu.jan30@gmail.com',NULL,NULL,NULL),('344ebdc0-3a0e-4200-b7ad-7ea3b78e15c1','Vijay Krishna Venkateswaran','$2a$10$h/4TpJWI8XCL.6yMKuGPTerW1E/s/5g.gLmOToTQqG6ngV9qpnrx2',_binary '','User',0,_binary '','07a5a4b5-b1ca-4f8c-b67f-40c9b0ce110e','0','User',0,'2024-06-30 01:39:09','2024-08-24 19:13:49','vijaykvenkat10@gmail.com',NULL,'945306','2024-08-24 19:16:49'),('448b3fe4-0c81-4f4f-80d5-97c2305e6848','giridharvrao','$2a$10$kQtAha6NpHo3CzbeOOglQuAQgtgzLKYoWaSYmRpLXR5WJH9DbV3IC',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2024-10-09 18:04:31','2024-10-09 18:04:31','giridharv9@gmail.com',NULL,NULL,NULL),('53608af8-0803-45a9-912e-1c2f4fc04b74','admin','$2a$10$FzPqvHFud6UJMKv8cxzEHuGoLZO/YYnHrk3pMECCVPkj9A.Y3EWla',_binary '','Admin',0,_binary '','07a5a4b5-b1ca-4f8c-b67f-40c9b0ce110e','0','User',0,'2024-06-28 01:55:57','2024-12-11 19:52:48','panditrajaji@gmail.com',NULL,NULL,NULL),('65b5a4d1-edff-4f6b-94d2-7e95da18d1d4','nidhi','$2a$10$Wi8Aglptq3ERV19jnzWLCuyVCTcxWyTOcZ1gazhix3fJb9IqAZX0C',_binary '','User',0,_binary '','07a5a4b5-b1ca-4f8c-b67f-40c9b0ce110e','0','User',0,'2024-06-28 01:49:49','2024-12-23 19:05:08','shreenidhi26@yahoo.com',NULL,NULL,NULL),('6e5d0640-e31d-489c-af5e-824b5198029d','madhuri','$2a$10$7FZ9rRM3cN0zu8I/JD89een.rOLLHauGVWOYIWfGzfaozA9nRsGES',_binary '','Admin',0,_binary '','9a64e1bd-3fe3-4912-92fa-a8a5d01106e1','0','User',0,'2024-06-19 00:45:41','2024-10-04 18:06:55','yadavmm.30@gmail.com',NULL,NULL,NULL),('7101bccb-8363-48cd-88bb-9aa253484a0b','chyavan','$2a$10$HFq0cJYaq3ZEjJipjuvPCeeaqci/Z/ZjDfoLt2mxFJN37OK8fLWdW',_binary '','Admin',0,_binary '','07a5a4b5-b1ca-4f8c-b67f-40c9b0ce110e','0','User',0,'2024-06-27 04:19:00','2024-07-12 01:19:37','chyavanphadke@gmail.com',NULL,NULL,NULL),('76d00451-dc1b-4cce-8929-ecf6ed7bf3eb','maheshbhandiwad','$2a$10$diXKpARr6ev2VcPNqxIZiOnftEodieo0PFnjd8rmLog.MDoi2CRWO',_binary '','User',0,_binary '','9a64e1bd-3fe3-4912-92fa-a8a5d01106e1','0','User',0,'2024-06-23 00:20:41','2024-10-03 20:03:20','mahesh.bhandiwad@gmail.com',NULL,NULL,NULL),('7faf492e-6452-4f90-ab32-d84a7be31470','bhushanhegde','$2a$10$t.NaYZne8.zoz8Atb9QqM.BDke4gtWiy.vc/rlD8YVSknhgvpYLHq',_binary '\0','Admin',0,_binary '','Auto Approved','0','User',0,'2024-09-13 19:21:46','2024-09-13 19:25:22','nagabhushanhegde007@gmail.com',NULL,NULL,NULL),('82b16fc3-e66b-4163-ace7-793e4ac01cec','dhaval','$2a$10$BJNZdutFD7KzsxzU1JoA8OQCet66k0nLs9FlC1oyDG8v9JPub4sDu',_binary '','User',0,_binary '','9a64e1bd-3fe3-4912-92fa-a8a5d01106e1','0','User',0,'2024-06-19 01:36:04','2024-09-01 17:48:01','Dhaval02@gmail.com',NULL,NULL,NULL),('836e2386-ae85-4402-b9b3-80f3ce72d6e5','Dhanush','$2a$10$4XoU/J.0vB4d.RDKi3NP8uhuY9AV62OPmOgoWq1ySpleYGe5hlMIm',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2024-06-29 02:42:31','2024-07-07 23:12:44','dhanushbh04@gmail.com',NULL,NULL,NULL),('885ca288-c35c-4ca1-8a45-cba192968722','sasijrao','$2a$10$FTdKJgpotR2.TSuetqBED.1lntpHuEUWg8SsO3rnHnSFxErcX.XvW',_binary '\0','Admin',0,_binary '','Auto Approved','0','User',0,'2024-07-17 03:01:22','2024-07-17 03:01:38','sasijrao@gmail.com',NULL,NULL,NULL),('885f9f27-f835-45d6-a516-298c60825972','Anand','$2a$10$js8UQtO7tHhemO0J5kjT1e4JOWi.nA59e.Rs8rEI9KCMAPKuHUvv6',_binary '\0','Admin',0,_binary '','Auto Approved','0','User',0,'2024-08-18 11:23:23','2024-08-18 11:39:53','lnarayanan.p@gmail.com',NULL,NULL,NULL),('92a614f9-f105-4823-a478-3469cbf7a100','tushararamesh','$2a$10$1h0qAFsbbJ.7fUYLNesyH.4N7Wt7sXx81yJH83Kfvt9xgbS2rmPLW',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2024-07-14 03:21:51','2024-08-22 20:04:33','tushararamesh15@gmail.com',NULL,NULL,NULL),('9a6653a1-8259-4e93-9361-e9b319f7b2ec','pjillell','$2a$10$VQfaSWoKM3T1tu7Hv.JMVuJpi3/shnLulPUx55kmXtRZcDPHIf4hO',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2024-08-09 18:42:13','2024-08-09 18:42:13','2prajeeth@gmail.com',NULL,NULL,NULL),('aa0b6518-15d8-4328-9d91-db283c5a0caa','saicrosoft','$2a$10$FW/SJ9DEow3jz2Yv.4B/l.hLh9gky6HzrsRWe9ZT2igbtwxcqxoIS',_binary '\0','Admin',0,_binary '','Auto Approved','0','User',0,'2024-07-30 18:39:18','2024-08-06 18:45:10','saicrosoft@gmail.com',NULL,NULL,NULL),('ab9dc0f4-7dc6-4550-b3d5-a454f946047d','kb','$2a$10$7Yf4HdLGZMzkMWaS43BLaOBUWzlDuGOzmn.r9EwhZFFpI0Ej7Ib8.',_binary '\0','Admin',0,_binary '','Auto Approved','0','User',0,'2024-08-18 19:46:19','2024-09-01 17:52:47','krkarthikbharadwaj@gmail.com',NULL,NULL,NULL),('anilv','Anil Vashistha','sa',_binary '','AD',1,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL),('c2fe50fd-7051-4f91-9cd3-881bf291df0a','saisri','$2a$10$L.p8iWKPV6j9Og1QkIloTOWrY.EyCSh80.EwWt4u8GN7Osff8yU7a',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2025-02-13 19:49:59','2025-02-13 19:49:59','saicosoft@gmail.com',NULL,NULL,NULL),('c5c81237-5b25-4e01-a910-cd28a5a2bb18','archana','$2a$10$sGJ4JOV9nUJVHgmsMJTR/urgRpI5jtfJONGSUiIN.UFg0gmz9N5UG',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2024-10-05 19:44:38','2024-10-05 19:44:38','archana.bhagavat@gmail.com',NULL,NULL,NULL),('d8283236-e581-4047-8aae-130c948ea307','shrika','$2a$10$jrtijTUGjLO5/lD1KAmLU.IUoCYGEkb/DQscx0SuuYhMJfz0GfmD.',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2025-02-25 21:17:59','2025-02-25 21:17:59','shrike.nivarti@gmail.com',NULL,NULL,NULL),('e1391a2b-a5d2-4a04-b587-75bd4f159a1f','DhanushAnna','$2b$10$cpB5/IRT9ltwgMIxzvRI5.ixuSVTPR7v0s6KVUj3OVGjNh0SymvKO',_binary '','User',0,_binary '','9a64e1bd-3fe3-4912-92fa-a8a5d01106e1','0','User',0,'2024-06-22 22:27:36','2024-06-22 22:31:04','dhanush.anna21@gmail.com',NULL,NULL,NULL),('e396e32c-9df4-4b45-a3d6-81efccf8bede','ssachinbharadwaj','$2b$10$NQ.j8FY441HfgTGD6oL4L.6XRDG2W3qOh6azUC5DcZtCDb2LHZJvm',_binary '','Admin',0,_binary '','9a64e1bd-3fe3-4912-92fa-a8a5d01106e1','0','User',0,'2024-06-21 03:30:38','2024-06-22 05:45:33','ssachinbharadwaj@gmail.com',NULL,NULL,NULL),('eb19f912-47cb-44ca-be98-9255f2d425ac','sais','$2a$10$LmGiduP5X4YAMA3xHbPJzOM8xsrHz123biyySBsJtIvDvsWhBqojq',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2024-10-09 18:43:08','2024-10-09 18:43:08','s@g.com',NULL,NULL,NULL),('f60f03f1-b119-4006-b72d-ec65ad522ee1','Marshini','$2a$10$t7b9Ma8przamnMpgTfApX.iK03iqU5tUAWbxqjcakCn1N98.eAWAm',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2024-09-01 18:47:11','2024-09-01 18:47:11','marshini.rao@gmail.com',NULL,NULL,NULL),('fe0aa56c-4a40-4e90-9b3c-261b901f5507','Deepas','$2a$10$CX8IkBoF0caZ0B3COabkvu09YSyCWqlBvYGA2OpLVjlYfmAycMra6',_binary '\0','User',0,_binary '','Auto Approved','0','User',0,'2024-10-17 13:32:09','2025-02-01 21:02:42','deepasaliyan@gmail.com',NULL,NULL,NULL),('fff927d1-a795-4604-993f-2e761a000545','Pranavi','$2a$10$nozkMzHzjYkKy.6aufGaauopPzsRKDHqmhc7cO6mtjTFiT47PClfq',_binary '\0','User',0,_binary '\0',NULL,'0','User',0,'2024-11-21 19:59:31','2025-02-07 19:40:55','pcellanki@gmail.com',NULL,NULL,NULL),('omdhimahi','omdhimahi','sharadaseva',_binary '','FD',0,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL),('online Paid','online Paid','online Paid',_binary '','FD',0,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL),('sharada','sharada','shubhalabha',_binary '','AD',0,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL),('website','Website','$2a$10$5.NpWPr9CC4nkM1BWP8gyes5dl60lkkcGUnrPbJUcRE8Ws4CLdpcy',_binary '\0','User',0,_binary '','Auto Approved','0','User',1,'2024-08-10 17:30:08','2024-08-10 17:30:08','website',NULL,NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-18 20:51:17
