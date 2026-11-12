CREATE TABLE `shopping_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quantity` text,
	`note` text,
	`added_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`bought_by` text,
	`bought_at` integer,
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bought_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `shopping_items_bought_at_idx` ON `shopping_items` (`bought_at`);