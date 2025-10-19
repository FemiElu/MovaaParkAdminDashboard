-- Database schema for drivers persistence
-- This should be added to your existing Prisma schema

-- Drivers table
CREATE TABLE drivers (
  id VARCHAR(255) PRIMARY KEY,
  park_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  license_number VARCHAR(50) NOT NULL,
  license_expiry TIMESTAMP NOT NULL,
  qualified_route VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(2,1) DEFAULT 5.0,
  vehicle_plate_number VARCHAR(20),
  address TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for better performance
  INDEX idx_park_id (park_id),
  INDEX idx_license_number (license_number),
  INDEX idx_qualified_route (qualified_route),
  INDEX idx_is_active (is_active),
  
  -- Unique constraint to prevent duplicate license numbers per park
  UNIQUE KEY unique_license_per_park (park_id, license_number)
);

-- Routes table (if not already exists)
CREATE TABLE routes (
  id VARCHAR(255) PRIMARY KEY,
  park_id VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_park_id (park_id),
  INDEX idx_destination (destination)
);

-- Insert some sample data
INSERT INTO routes (id, park_id, destination, base_price) VALUES
('r_lekk_1', 'lekki-phase-1-motor-park', 'Lagos', 5000.00),
('r_lekk_2', 'lekki-phase-1-motor-park', 'Abuja', 15000.00),
('r_lekk_3', 'lekki-phase-1-motor-park', 'Port Harcourt', 12000.00),
('r_ikej_1', 'ikeja-motor-park', 'Ibadan', 8000.00),
('r_ikej_2', 'ikeja-motor-park', 'Ilesa', 10000.00),
('r_ikej_3', 'ikeja-motor-park', 'Port Harcourt', 12000.00),
('r_ajah_1', 'ajah-motor-park', 'Ibadan', 8000.00);

-- Insert some sample drivers
INSERT INTO drivers (id, park_id, name, phone, license_number, license_expiry, qualified_route, is_active, rating, vehicle_plate_number, address) VALUES
('d_lekk_1', 'lekki-phase-1-motor-park', 'Adewale Ibrahim', '+2348030000000', 'AKW06968AA2', DATE_ADD(NOW(), INTERVAL 30 DAY), 'Lagos', true, 5.0, 'ABC-123DE', 'Lekki Phase 1, Lagos'),
('d_lekk_2', 'lekki-phase-1-motor-park', 'Chinedu Okafor', '+2348031111111', 'BAY12345CD6', DATE_ADD(NOW(), INTERVAL 5 DAY), 'Abuja', true, 4.0, 'DEF-456GH', 'Victoria Island, Lagos'),
('d_lekk_3', 'lekki-phase-1-motor-park', 'Hassan Musa', '+2348032222222', 'KAN54321EF7', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Port Harcourt', false, 3.0, 'GHI-789JK', 'Lekki Gardens, Lagos'),
('d_ikej_1', 'ikeja-motor-park', 'Emeka Okafor', '+2348033333333', 'LAG12345GH8', DATE_ADD(NOW(), INTERVAL 15 DAY), 'Ibadan', true, 4.5, 'JKL-012MN', 'Ikeja, Lagos'),
('d_ikej_2', 'ikeja-motor-park', 'Fatima Ibrahim', '+2348034444444', 'OSU23456HI9', DATE_ADD(NOW(), INTERVAL 20 DAY), 'Ilesa', true, 4.8, 'NOP-345QR', 'Alausa, Lagos'),
('d_ikej_3', 'ikeja-motor-park', 'Chinedu Anyanwu', '+2348035555555', 'PHC34567KL9', DATE_ADD(NOW(), INTERVAL 10 DAY), 'Port Harcourt', true, 4.2, 'STU-456VW', 'Ikeja, Lagos'),
('d_ikej_4', 'ikeja-motor-park', 'Aisha Mohammed', '+2348036666666', 'IBA76543MN1', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Port Harcourt', false, 4.0, 'WXY-901ZA', 'Alausa, Lagos');




