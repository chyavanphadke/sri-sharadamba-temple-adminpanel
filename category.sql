USE seva_new;

DROP TABLE IF EXISTS `ServiceCategory`;

CREATE TABLE `ServiceCategory` (
  `category_id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

INSERT INTO `ServiceCategory` (`category_id`, `category_name`, `active`) VALUES
(1, 'General', 1),
(2, 'Maharudra', 1);

ALTER TABLE `service`
ADD COLUMN `category_id` int unsigned DEFAULT NULL,
ADD COLUMN `excelSheetLink` varchar(255) DEFAULT NULL;
