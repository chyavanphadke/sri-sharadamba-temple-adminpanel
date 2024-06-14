-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: seva
-- ------------------------------------------------------
-- Server version	8.4.0

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
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `userid` varchar(50) NOT NULL DEFAULT '',
  `username` varchar(80) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `active` bit(1) NOT NULL DEFAULT b'1',
  `usertype` varchar(50) NOT NULL DEFAULT 'FD',
  `su` int unsigned NOT NULL DEFAULT '0',
  `approved` bit(1) DEFAULT NULL,
  `approvedBy` varchar(45) DEFAULT NULL,
  `super_user` varchar(45) DEFAULT NULL,
  `reason_for_access` varchar(45) DEFAULT NULL,
  `old_users` bit(1) DEFAULT NULL,
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
INSERT INTO `user` VALUES ('64992fad-2408-4bd7-9dd4-149c950a2a58','chyavanphadke','$2b$10$BD4Jc4Hl5hg1S2zCLW3mCe3oUrI4Ji/gZTtwzOvtXcEOwAszuDY1q',_binary '','Super Admin',0,_binary '','9a64e1bd-3fe3-4912-92fa-a8a5d01106e1','0','User',_binary '\0','2024-06-14 18:28:50','2024-06-14 18:29:37','chyavanphadke@gmail.com',NULL,NULL,NULL),('66891794-8ccc-4c88-9197-a0222710a517','admin','$2b$10$TtMBl860yE69azVtga/Bc.eDEbk/zZu.7URjMCYVIBD7CGY4HHTou',_binary '','Super Admin',0,_binary '','0','1','Initial super user',_binary '\0','2024-06-14 18:28:23','2024-06-14 18:28:23',NULL,NULL,NULL,NULL),('anilv','Anil Vashistha','sa',_binary '','AD',1,NULL,NULL,NULL,NULL,_binary '',NULL,NULL,NULL,NULL,NULL,NULL),('omdhimahi','omdhimahi','sharadaseva',_binary '','FD',0,NULL,NULL,NULL,NULL,_binary '',NULL,NULL,NULL,NULL,NULL,NULL),('sharada','sharada','shubhalabha',_binary '','AD',0,NULL,NULL,NULL,NULL,_binary '',NULL,NULL,NULL,NULL,NULL,NULL);
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

-- Dump completed on 2024-06-14 11:30:29
