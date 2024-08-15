PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Table: User
CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE,
    userpassword VARCHAR(50) NOT NULL,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: UserProfile
CREATE TABLE UserProfile (
  userId INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT,
  contactNumber TEXT,
  address TEXT,
  emergencyContact TEXT,
  petPhoto TEXT,
  petName TEXT,
  petBreed TEXT,
  petAge INTEGER,
  petWeight REAL,
  petHealth TEXT,
  petDiet TEXT,
  petAllergies TEXT,
  serviceFrequency TEXT,
  specialRequirements TEXT
);

--- Table: Review
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staffName TEXT NOT NULL,
    rating INT,
    feedback TEXT NOT NULL
);

-- Create Booking table
CREATE TABLE IF NOT EXISTS Bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package TEXT NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL
);

COMMIT;
