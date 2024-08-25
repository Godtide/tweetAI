CREATE DATABASE tweetai;

USE tweetai;

CREATE TABLE Autobots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255)
);

CREATE TABLE Posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE,
    body TEXT,
    autbot_id INT,
    FOREIGN KEY (autbot_id) REFERENCES Autobots(id)
);

CREATE TABLE Comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,
    body TEXT,
    FOREIGN KEY (post_id) REFERENCES Posts(id)
);
