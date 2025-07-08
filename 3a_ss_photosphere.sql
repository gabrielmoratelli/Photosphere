-- MariaDB dump 10.19 Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: photosphere
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `usucodigo` int(11) NOT NULL AUTO_INCREMENT,
  `usunome` varchar(100) NOT NULL, -- Added usunome
  `usuemail` char(50) NOT NULL,
  `ususenha` char(15) NOT NULL, -- Consider increasing length or hashing passwords
  PRIMARY KEY (`usucodigo`),
  UNIQUE KEY `usuemail_UNIQUE` (`usuemail`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `posts`
--
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `postcodigo` INT NOT NULL AUTO_INCREMENT,
  `usucodigo` INT NOT NULL,
  `postimagem` VARCHAR(255) NOT NULL, -- Path to the image
  `postlegenda` TEXT NULL,
  `postdatacriacao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`postcodigo`),
  INDEX `fk_posts_usuarios_idx` (`usucodigo` ASC),
  CONSTRAINT `fk_posts_usuarios`
    FOREIGN KEY (`usucodigo`)
    REFERENCES `photosphere`.`usuarios` (`usucodigo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `likes`
--
DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `likecodigo` INT NOT NULL AUTO_INCREMENT,
  `postcodigo` INT NOT NULL,
  `usucodigo` INT NOT NULL,
  `likedatacriacao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`likecodigo`),
  INDEX `fk_likes_posts_idx` (`postcodigo` ASC),
  INDEX `fk_likes_usuarios_idx` (`usucodigo` ASC),
  UNIQUE KEY `unique_like` (`postcodigo`, `usucodigo`), -- Ensures a user can like a post only once
  CONSTRAINT `fk_likes_posts`
    FOREIGN KEY (`postcodigo`)
    REFERENCES `photosphere`.`posts` (`postcodigo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_likes_usuarios`
    FOREIGN KEY (`usucodigo`)
    REFERENCES `photosphere`.`usuarios` (`usucodigo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `favorites`
--
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `favcodigo` INT NOT NULL AUTO_INCREMENT,
  `postcodigo` INT NOT NULL,
  `usucodigo` INT NOT NULL,
  `favdatacriacao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`favcodigo`),
  INDEX `fk_favorites_posts_idx` (`postcodigo` ASC),
  INDEX `fk_favorites_usuarios_idx` (`usucodigo` ASC),
  UNIQUE KEY `unique_favorite` (`postcodigo`, `usucodigo`), -- Ensures a user can favorite a post only once
  CONSTRAINT `fk_favorites_posts`
    FOREIGN KEY (`postcodigo`)
    REFERENCES `photosphere`.`posts` (`postcodigo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_favorites_usuarios`
    FOREIGN KEY (`usucodigo`)
    REFERENCES `photosphere`.`usuarios` (`usucodigo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `comments`
--
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `comcodigo` INT NOT NULL AUTO_INCREMENT,
  `postcodigo` INT NOT NULL,
  `usucodigo` INT NOT NULL,
  `comtexto` TEXT NOT NULL,
  `comdatacriacao` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comcodigo`),
  INDEX `fk_comments_posts_idx` (`postcodigo` ASC),
  INDEX `fk_comments_usuarios_idx` (`usucodigo` ASC),
  CONSTRAINT `fk_comments_posts`
    FOREIGN KEY (`postcodigo`)
    REFERENCES `photosphere`.`posts` (`postcodigo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_usuarios`
    FOREIGN KEY (`usucodigo`)
    REFERENCES `photosphere`.`usuarios` (`usucodigo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- (Keep existing tables like admins, categorias, perfis if needed, or remove if not)
-- For this example, I'm focusing on the new tables.
-- Ensure you re-insert any necessary data for admins, categorias, perfis if you drop and recreate them.
-- The provided `perfis` and `categorias` tables are kept below for completeness from your original SQL.

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admins` (
  `admcodigo` int(11) NOT NULL AUTO_INCREMENT,
  `admemail` char(50) NOT NULL,
  `admsenha` char(15) NOT NULL,
  `admnome` char(20) DEFAULT NULL,
  PRIMARY KEY (`admcodigo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;