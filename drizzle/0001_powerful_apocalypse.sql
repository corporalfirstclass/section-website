CREATE TABLE `cms_collections` (
	`key` text PRIMARY KEY NOT NULL,
	`draft_json` text NOT NULL,
	`published_json` text,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	`updated_by` text NOT NULL
);
