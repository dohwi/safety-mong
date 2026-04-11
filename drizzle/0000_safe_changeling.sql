CREATE TABLE `answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`participant_id` integer NOT NULL,
	`selected_index` integer NOT NULL,
	`is_correct` integer NOT NULL,
	`response_time_ms` integer,
	`submitted_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `answer_unique_idx` ON `answers` (`session_id`,`question_id`,`participant_id`);--> statement-breakpoint
CREATE INDEX `answer_session_idx` ON `answers` (`session_id`);--> statement-breakpoint
CREATE TABLE `participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`nickname` text NOT NULL,
	`reconnect_token` text,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_reconnect_token_unique` ON `participants` (`reconnect_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `participant_session_nickname_idx` ON `participants` (`session_id`,`nickname`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_box_id` integer NOT NULL,
	`index` integer NOT NULL,
	`text` text NOT NULL,
	`options` text NOT NULL,
	`correct_index` integer NOT NULL,
	`question_duration_ms` integer DEFAULT 30000 NOT NULL,
	`explanation` text,
	`category` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`quiz_box_id`) REFERENCES `quiz_boxes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quiz_boxes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`safety_content` text,
	`instructor_id` integer NOT NULL,
	`question_duration_ms` integer DEFAULT 30000 NOT NULL,
	`is_confirmed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`quiz_box_id` integer NOT NULL,
	`instructor_id` integer NOT NULL,
	`phase` text NOT NULL,
	`current_question_index` integer DEFAULT 0 NOT NULL,
	`target_participant_count` integer,
	`started_at` text,
	`ended_at` text,
	`ai_analysis` text,
	`ai_suggestions` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`quiz_box_id`) REFERENCES `quiz_boxes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_code_unique` ON `sessions` (`code`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);