CREATE TABLE `complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`municipalityId` varchar(64) NOT NULL,
	`complaintText` text NOT NULL,
	`status` enum('open','in_review','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`)
);
