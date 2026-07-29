CREATE TABLE `cms_pages` (
	`slug` text PRIMARY KEY NOT NULL,
	`draft_html` text NOT NULL,
	`published_html` text,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`contact_number` text,
	`company` text,
	`message` text NOT NULL,
	`delivery_status` text DEFAULT 'stored' NOT NULL,
	`created_at` integer NOT NULL
);
