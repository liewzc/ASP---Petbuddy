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
CREATE TABLE IF NOT EXISTS UserProfile (
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

-- Bookings Table
CREATE TABLE IF NOT EXISTS Bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    packageDetails TEXT NOT NULL,   -- JSON string containing the details of selected packages/addons
    totalPrice REAL NOT NULL,       -- The total price for the booking
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- StaffBookings Table
CREATE TABLE IF NOT EXISTS StaffBookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookingId INTEGER,                -- Foreign key linking to the Bookings table
    staffName TEXT NOT NULL,
    bookingDate TEXT NOT NULL,        -- Stored in 'YYYY-MM-DD' format
    timeSlot TEXT NOT NULL,           -- Stored in 'HH:mm' format
    FOREIGN KEY (bookingId) REFERENCES Bookings(id) ON DELETE CASCADE
);

COMMIT;
