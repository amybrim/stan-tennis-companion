CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_drops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromName` varchar(64) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_drops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guest_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`name` varchar(64) NOT NULL DEFAULT 'Steve',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guest_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `guest_sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(64) NOT NULL,
	`authorName` varchar(64) NOT NULL DEFAULT 'Steve',
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`emoji` varchar(8) DEFAULT '🎾',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pick_battles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(64) NOT NULL,
	`matchDescription` varchar(300) NOT NULL,
	`player1` varchar(100) NOT NULL,
	`player2` varchar(100) NOT NULL,
	`stanPick` varchar(100) NOT NULL,
	`stevePick` varchar(100),
	`actualWinner` varchar(100),
	`stanCorrect` boolean,
	`steveCorrect` boolean,
	`tournament` varchar(150),
	`round` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `pick_battles_id` PRIMARY KEY(`id`)
);
