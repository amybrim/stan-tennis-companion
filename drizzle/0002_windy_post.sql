CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guestId` varchar(64) NOT NULL,
	`event` varchar(128) NOT NULL,
	`page` varchar(128),
	`label` varchar(256),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
