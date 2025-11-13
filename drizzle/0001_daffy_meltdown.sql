CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`municipalityId` varchar(64),
	`action` varchar(255) NOT NULL,
	`details` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `municipalities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`municipalityId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`state` varchar(2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `municipalities_id` PRIMARY KEY(`id`),
	CONSTRAINT `municipalities_municipalityId_unique` UNIQUE(`municipalityId`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` varchar(64) NOT NULL,
	`municipalityId` varchar(64) NOT NULL,
	`vereadorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','approved','rejected','archived') NOT NULL DEFAULT 'pending',
	`voteCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`),
	CONSTRAINT `proposals_proposalId_unique` UNIQUE(`proposalId`)
);
--> statement-breakpoint
CREATE TABLE `themeConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`municipalityId` varchar(64) NOT NULL,
	`primaryColor` varchar(7) DEFAULT '#0066cc',
	`secondaryColor` varchar(7) DEFAULT '#f0f0f0',
	`logoUrl` text,
	`accentColor` varchar(7) DEFAULT '#ff6b35',
	`fontFamily` varchar(255) DEFAULT '''Inter'', sans-serif',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `themeConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`citizenId` int NOT NULL,
	`municipalityId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('citizen','vereador','admin','superadmin') NOT NULL DEFAULT 'citizen';--> statement-breakpoint
ALTER TABLE `users` ADD `cpf` varchar(11) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` date;--> statement-breakpoint
ALTER TABLE `users` ADD `cep` varchar(8);--> statement-breakpoint
ALTER TABLE `users` ADD `municipalityId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `isEmailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `isCpfVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `lastFailedLoginAttempt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `failedLoginCount` int DEFAULT 0;