CREATE TABLE `authors` (
	`id` integer PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `post_categories` (
	`post_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`post_created_at` integer NOT NULL,
	CONSTRAINT `post_categories_pk` PRIMARY KEY(`post_id`, `category_id`),
	CONSTRAINT `fk_post_categories_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`),
	CONSTRAINT `fk_post_categories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_tags` (
	`post_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`post_created_at` integer NOT NULL,
	CONSTRAINT `post_tags_pk` PRIMARY KEY(`post_id`, `tag_id`),
	CONSTRAINT `fk_post_tags_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`),
	CONSTRAINT `fk_post_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`search_title` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`featured_media_url` text,
	`author_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_posts_author_id_authors_id_fk` FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY,
	`slug` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE INDEX `post_categories_category_id_post_created_at_post_id_idx` ON `post_categories` (`category_id`,`post_created_at`,`post_id`);--> statement-breakpoint
CREATE INDEX `post_tags_tag_id_post_created_at_post_id_idx` ON `post_tags` (`tag_id`,`post_created_at`,`post_id`);--> statement-breakpoint
CREATE INDEX `posts_created_at_id_search_title_idx` ON `posts` (`created_at`,`id`,`search_title`);--> statement-breakpoint
CREATE INDEX `posts_author_id_created_at_id_idx` ON `posts` (`author_id`,`created_at`,`id`);