-- version 10.6.4-MariaDB

CREATE DATABASE `bookstore_js`
SET FOREIGN_KEY_CHECKS=0; -- to disable them

DROP TABLE IF EXISTS `booklist`;
CREATE TABLE `booklist` (
  `index` int(10) NOT NULL AUTO_INCREMENT,
  `bookname` varchar(100) DEFAULT NULL,
  `introduction` varchar(1000) DEFAULT NULL,
  `price` decimal(7,2) DEFAULT NULL,
  `types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `inventory` int(10) NOT NULL DEFAULT 0,
  PRIMARY KEY (`index`),
  KEY `booklist2_index_IDX` (`index`) USING BTREE,
  KEY `booklist2_bookname_IDX` (`bookname`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4;

LOCK TABLES `booklist` WRITE;

INSERT INTO `booklist` VALUES
  (8,'math is fun','',5.50,'[0]',100),
  (9,'basic algorithm','Introduce basic algorithm,such as sorting,searching,...',13.00,'[0,3]',90),
  (10,'harry potter','he novels chronicle the lives of a young wizard, Harry Potter, and his friends Hermione Granger and Ron Weasley, all of whom are students at Hogwarts School of Witchcraft and Wizardry. ',4.56,'[1,6]',80),
  (11,'modern peotry','Many modern english poems included',7.00,'[1,7]',70),
  (12,'The Three-Body Problem','The basic setting of the novel involves the three-body problem in classical mechanics. Trisolarans living in the Trisolaran world are constantly evolving and destroying. The latest generation of Trisolarans has a scientific level that surpasses the civilization of the earth by several times.',9.99,'[2,4,5]',60),
  (13,'The Bacteria Book','A children science book that list some common Bacteria',6.78,'[2,4]',50),
  (14,'Computer Science: An Overview','',25.99,'[3]',50);

UNLOCK TABLES;

DROP TABLE IF EXISTS `bookorder`;
CREATE TABLE `bookorder` (
  `order_index` int(10) NOT NULL AUTO_INCREMENT,
  `user_index` int(10) DEFAULT NULL,
  `order_datetime` datetime DEFAULT current_timestamp(),
  `price` decimal(7,2) DEFAULT 0.00,
  `order_detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`order_detail`)),
  PRIMARY KEY (`order_index`),
  KEY `bookorder_FK` (`user_index`),
  CONSTRAINT `bookorder_FK` FOREIGN KEY (`user_index`) REFERENCES `user` (`user_index`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4;

LOCK TABLES `bookorder` WRITE;
INSERT INTO `bookorder` VALUES (50,1,'2023-03-09 21:14:42',109.45,'{\"math is fun\":5,\"The Three-Body Problem\":3,\"Computer Science: An Overview\":2}'),(51,1,'2023-03-09 21:15:45',101.52,'{\"The Three-Body Problem\":1,\"The Bacteria Book\":2,\"Computer Science: An Overview\":3}'),(52,1,'2023-03-10 00:57:41',45.18,'{\"math is fun\":1,\"basic algorithm\":2,\"harry potter\":3}'),(53,1,'2023-03-10 00:57:59',157.29,'{\"modern peotry\":1,\"The Bacteria Book\":3,\"Computer Science: An Overview\":5}'),(54,2,'2023-03-10 00:58:32',82.02,'{\"basic algorithm\":3,\"harry potter\":2,\"The Bacteria Book\":5}'),(55,2,'2023-03-10 00:58:41',300.41,'{\"math is fun\":7,\"modern peotry\":4,\"Computer Science: An Overview\":9}'),(56,2,'2023-03-10 00:58:56',169.41,'{\"harry potter\":8,\"modern peotry\":9,\"The Three-Body Problem\":7}'),(57,2,'2023-03-10 00:59:05',189.88,'{\"math is fun\":4,\"The Three-Body Problem\":9,\"Computer Science: An Overview\":3}'),(58,3,'2023-03-10 00:59:55',340.91,'{\"basic algorithm\":5,\"modern peotry\":6,\"Computer Science: An Overview\":9}'),(59,3,'2023-03-10 01:00:04',29.49,'{\"math is fun\":1,\"basic algorithm\":1,\"The Three-Body Problem\":1.1}'),(60,3,'2023-03-01 01:17:26',0.00,'{}'),(61,3,'2023-03-10 01:18:23',0.00,'{\"math is fun\":2}');
UNLOCK TABLES;

DROP TABLE IF EXISTS `bookstore_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookstore_state` (
  `id` varchar(100) CHARACTER SET utf8mb3 DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `bookstore_state` WRITE;
/*!40000 ALTER TABLE `bookstore_state` DISABLE KEYS */;
INSERT INTO `bookstore_state` VALUES ('1',101793.84);
/*!40000 ALTER TABLE `bookstore_state` ENABLE KEYS */;
UNLOCK TABLES;

DROP TABLE IF EXISTS `type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `type` (
  `type_id` int(11) NOT NULL DEFAULT 0,
  `type_name` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOCK TABLES `type` WRITE;
/*!40000 ALTER TABLE `type` DISABLE KEYS */;
INSERT INTO `type` VALUES (0,'math'),(1,'english'),(2,'biology'),(3,'computer'),(4,'entertainment'),(5,'science_fiction'),(6,'novel'),(7,'poetry');
/*!40000 ALTER TABLE `type` ENABLE KEYS */;
UNLOCK TABLES;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `user_index` int(10) NOT NULL AUTO_INCREMENT,
  `user` varchar(100) NOT NULL DEFAULT 'abc',
  `hashed_password` char(128) DEFAULT NULL,
  `balance` decimal(7,2) NOT NULL DEFAULT 0.00,
  `identity` int(11) NOT NULL DEFAULT 0 COMMENT '0=user,1=admin',
  `email` varchar(200) DEFAULT NULL,
  `google_name` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`user_index`),
  UNIQUE KEY `user_un` (`user`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1; -- to enable them
CREATE USER 'bookstore_user'@'%' IDENTIFIED BY 'test';
GRANT Select ON bookstore_js.`booklist` TO 'bookstore_user'@'%';
GRANT Update ON bookstore_js.`booklist` TO 'bookstore_user'@'%';
GRANT Insert ON bookstore_js.`bookorder` TO 'bookstore_user'@'%';
GRANT Select ON bookstore_js.`bookorder` TO 'bookstore_user'@'%';
GRANT Delete ON bookstore_js.`bookorder` TO 'bookstore_user'@'%';
GRANT Select ON bookstore_js.`user` TO 'bookstore_user'@'%';
GRANT Insert ON bookstore_js.`user` TO 'bookstore_user'@'%';
GRANT Update ON bookstore_js.`user` TO 'bookstore_user'@'%';
GRANT Select ON bookstore_js.`type` TO 'bookstore_user'@'%';
GRANT Select ON bookstore_js.`bookstore_state` TO 'bookstore_user'@'%';
GRANT Update ON bookstore_js.`bookstore_state` TO 'bookstore_user'@'%';

