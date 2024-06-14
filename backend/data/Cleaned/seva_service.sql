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
  PRIMARY KEY (`ServiceId`)
) ENGINE=InnoDB AUTO_INCREMENT=284 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service`
--

LOCK TABLES `service` WRITE;
/*!40000 ALTER TABLE `service` DISABLE KEYS */;
INSERT INTO `service` VALUES (2,'DONATION',0,'',_binary '',_binary '',0,3),(268,'Archana',11,'',_binary '',_binary '',0,3),(269,'Annadan',251,'',_binary '',_binary '',1,4),(270,'Rathotsava Seva',101,'',_binary '',_binary '',1,3),(271,'Mahaposhaka',10001,'',_binary '',_binary '',1,5),(272,'Pradhana Yajamana',5001,'',_binary '',_binary '',1,5),(273,'Gana Yajamana',2001,'',_binary '',_binary '',1,5),(274,'Maharudram 1 Day Sponsor',1001,'',_binary '',_binary '',1,3),(275,'Rudrabhisheka & Kramarchana',501,'',_binary '',_binary '',1,5),(276,'Kalyanotsavam',251,'',_binary '',_binary '',1,5),(277,'Vastra Sponsor',0,'',_binary '',_binary '',1,3),(278,'Flower Sponsor',0,'',_binary '',_binary '',1,3),(279,'Satyanarayana Pooja',51,'',_binary '',_binary '',1,3),(280,'Pradosha Pooja',51,'',_binary '',_binary '',1,3),(281,'Sankata Hara Chaturthi',51,'',_binary '',_binary '',1,3),(282,'Sarva Seva ',501,'',_binary '',_binary '',1,3),(283,'Satyanarana Pooja',51,'',_binary '\0',_binary '\0',0,3);
/*!40000 ALTER TABLE `service` ENABLE KEYS */;
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
