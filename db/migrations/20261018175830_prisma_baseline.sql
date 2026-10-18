-- Baseline for the tables that Prisma created in the production database.
-- Every statement is a no-op when the table already exists, so the first
-- deploy only records this migration in `_void_migrations`.
CREATE TABLE IF NOT EXISTS `Category` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`description` text,
	CONSTRAINT `Category_id` PRIMARY KEY(`id`),
	CONSTRAINT `Category_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `CategoriesOnPosts` (
	`postId` int NOT NULL,
	`categoryId` int NOT NULL,
	CONSTRAINT `CategoriesOnPosts_postId_categoryId_pk` PRIMARY KEY(`postId`,`categoryId`),
	INDEX `CategoriesOnPosts_categoryId_idx` (`categoryId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Post` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) NOT NULL,
	`title` text NOT NULL,
	`content` longtext NOT NULL,
	`authorId` int NOT NULL,
	`featuredMediaUrl` varchar(191),
	CONSTRAINT `Post_id` PRIMARY KEY(`id`),
	CONSTRAINT `Post_slug_key` UNIQUE(`slug`),
	INDEX `Post_authorId_idx` (`authorId`),
	INDEX `Post_createdAt_idx` (`createdAt` DESC)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Tag` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`description` text,
	CONSTRAINT `Tag_id` PRIMARY KEY(`id`),
	CONSTRAINT `Tag_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `TagsOnPosts` (
	`postId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `TagsOnPosts_postId_tagId_pk` PRIMARY KEY(`postId`,`tagId`),
	INDEX `TagsOnPosts_tagId_idx` (`tagId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `User` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`description` text,
	CONSTRAINT `User_id` PRIMARY KEY(`id`),
	CONSTRAINT `User_slug_key` UNIQUE(`slug`)
);
