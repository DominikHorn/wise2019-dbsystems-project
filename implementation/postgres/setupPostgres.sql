CREATE SCHEMA IF NOT EXISTS "voting-data" AUTHORIZATION postgres;

-- Table storing user entities
CREATE TABLE IF NOT EXISTS "voting-data".person (
	id int NOT NULL GENERATED ALWAYS AS IDENTITY,
	"name" varchar NOT NULL,
	givenname varchar NOT NULL,
	CONSTRAINT users_pk PRIMARY KEY (id),
);