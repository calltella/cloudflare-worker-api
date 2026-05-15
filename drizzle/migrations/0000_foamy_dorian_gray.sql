CREATE TABLE `apline_base` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`apid` text,
	`title` text,
	`status_id` integer DEFAULT 0,
	`organization` text,
	`responsible` text,
	`work_content` text,
	`survey_results` text,
	`deal_answer` text,
	`reception` text,
	`work_start_time` text,
	`work_end_time` text,
	`occurrence_date` text,
	`customer_impact` text,
	`corresponding_note` text,
	`mail_flag` integer DEFAULT false,
	`acceptance_id` integer,
	`slip_issuance_id` integer,
	`item_updater_id` integer,
	`request_category_id` integer,
	`classification_id` integer DEFAULT 0,
	`subsystem_id` integer DEFAULT 0,
	`business_id` integer DEFAULT 0,
	`emergency_id` integer DEFAULT 0,
	`impact_id` integer DEFAULT 0,
	`priority_id` integer DEFAULT 0,
	`cause_id` integer DEFAULT 0,
	`deal_id` integer DEFAULT 0,
	`severity_id` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `apline_base_apid_unique` ON `apline_base` (`apid`);--> statement-breakpoint
CREATE INDEX `apline_base_search_index` ON `apline_base` (`apid`,`title`,`work_content`,`organization`,`survey_results`,`deal_answer`,`customer_impact`,`corresponding_note`);--> statement-breakpoint
CREATE TABLE `apline_business` (
	`id` integer PRIMARY KEY NOT NULL,
	`business` text NOT NULL,
	`sort_order` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_cause` (
	`id` integer PRIMARY KEY NOT NULL,
	`cause` text NOT NULL,
	`sort_order` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_classification` (
	`id` integer PRIMARY KEY NOT NULL,
	`classification` text NOT NULL,
	`sort_order` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_deal` (
	`id` integer PRIMARY KEY NOT NULL,
	`deal` text NOT NULL,
	`sort_order` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_emergency` (
	`id` integer PRIMARY KEY NOT NULL,
	`emergency` text NOT NULL,
	`sort_order` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_impact` (
	`id` integer PRIMARY KEY NOT NULL,
	`impact` text NOT NULL,
	`sort_order` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_priority` (
	`id` integer PRIMARY KEY NOT NULL,
	`priority` text NOT NULL,
	`sort_order` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_request_category` (
	`id` integer PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`order_no` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_severity` (
	`id` integer PRIMARY KEY NOT NULL,
	`severity` text NOT NULL,
	`sort_order` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_status` (
	`id` integer PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`order_no` integer NOT NULL,
	`badge_color` text DEFAULT 'gray' NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_subsystem` (
	`id` integer PRIMARY KEY NOT NULL,
	`subsystem` text NOT NULL,
	`sort_order` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apline_article_locks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`locked_by` text NOT NULL,
	`locked_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`released_at` integer,
	`lock_token` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_article_locks_article_id` ON `apline_article_locks` (`article_id`);--> statement-breakpoint
CREATE INDEX `idx_article_locks_expires_at` ON `apline_article_locks` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `apline_article_locks_article_id_unique` ON `apline_article_locks` (`article_id`);--> statement-breakpoint
CREATE TABLE `apline_drafts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`article_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `apline_base`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `apline_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`article_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `apline_favorites_user_id_article_id_unique` ON `apline_favorites` (`user_id`,`article_id`);--> statement-breakpoint
CREATE TABLE `apline_file_store` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`folder` text NOT NULL,
	`file_path` text,
	`file_name` text NOT NULL,
	`ext` text NOT NULL,
	`size` integer NOT NULL,
	`md5_hash` text,
	`join_id` integer,
	`download_key` text NOT NULL,
	`temp_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `apline_pulldown_list` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_no` integer NOT NULL,
	`tencd` integer NOT NULL,
	`pulldown_name` text NOT NULL,
	`pgroonga_search_word` text,
	`order_no` integer NOT NULL,
	`regist_name` text NOT NULL,
	`regist_order` integer NOT NULL,
	`d1_search_word` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_unread_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`article_id` integer NOT NULL,
	`reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `apline_base`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_unread_user_id` ON `user_unread_articles` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_unread_article_id` ON `user_unread_articles` (`article_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_unread_unique` ON `user_unread_articles` (`user_id`,`article_id`);--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`fileName` text NOT NULL,
	`filePath` text NOT NULL,
	`contentType` text NOT NULL,
	`expiresAt` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`apline_user_id` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_user_id_unique` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `apline_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`display_name_short` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_histories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`country` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `login_user_idx` ON `login_histories` (`user_id`);--> statement-breakpoint
CREATE INDEX `login_created_idx` ON `login_histories` (`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text DEFAULT 'default.png',
	`password_hash` text,
	`email_verified` text,
	`is_active` integer DEFAULT true NOT NULL,
	`role` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `user` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
