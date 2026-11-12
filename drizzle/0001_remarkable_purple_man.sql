CREATE TABLE `cleaning_area_members` (
	`area_id` text NOT NULL,
	`user_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`area_id`, `user_id`),
	FOREIGN KEY (`area_id`) REFERENCES `cleaning_areas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cleaning_areas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`interval_weeks` integer DEFAULT 1 NOT NULL,
	`start_week` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cleaning_completions` (
	`area_id` text NOT NULL,
	`week` text NOT NULL,
	`user_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	PRIMARY KEY(`area_id`, `week`),
	FOREIGN KEY (`area_id`) REFERENCES `cleaning_areas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cleaning_task_checks` (
	`task_id` text NOT NULL,
	`week` text NOT NULL,
	`user_id` text NOT NULL,
	`checked_at` integer NOT NULL,
	PRIMARY KEY(`task_id`, `week`),
	FOREIGN KEY (`task_id`) REFERENCES `cleaning_tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cleaning_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`area_id` text NOT NULL,
	`text` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`area_id`) REFERENCES `cleaning_areas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cleaning_tasks_area_id_idx` ON `cleaning_tasks` (`area_id`);--> statement-breakpoint
CREATE TABLE `cleaning_week_overrides` (
	`area_id` text NOT NULL,
	`week` text NOT NULL,
	`user_id` text,
	PRIMARY KEY(`area_id`, `week`),
	FOREIGN KEY (`area_id`) REFERENCES `cleaning_areas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
