-- Create custom types
CREATE TYPE user_type AS ENUM ('citizen', 'vendor');
CREATE TYPE waste_type AS ENUM ('plastic', 'paper', 'organic', 'glass', 'metal');
CREATE TYPE weight_category AS ENUM ('small', 'medium', 'large');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'assigned', 'in_progress', 'completed', 'cancelled', 'declined');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    user_type user_type NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    contact TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_waste_types table (many-to-many relationship)
CREATE TABLE vendor_waste_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    waste_type waste_type NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, waste_type)
);

-- Create pickup_requests table
CREATE TABLE pickup_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    citizen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    waste_type waste_type NOT NULL,
    weight_category weight_category NOT NULL,
    approximate_weight DECIMAL(10,2),
    actual_weight DECIMAL(10,2),
    waste_photo_url TEXT,
    status request_status DEFAULT 'pending',
    assigned_vendor_id UUID REFERENCES profiles(id),
    pickup_date DATE,
    pickup_time TIME,
    citizen_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table
CREATE TABLE bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES pickup_requests(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    waste_type waste_type NOT NULL,
    actual_weight DECIMAL(10,2) NOT NULL,
    rate_per_kg DECIMAL(10,2) NOT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 10.00,
    net_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_waste_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Vendor waste types policies
CREATE POLICY "Vendors can manage their waste types" ON vendor_waste_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'vendor'
            AND profiles.id = vendor_waste_types.vendor_id
        )
    );

-- Pickup requests policies
CREATE POLICY "Citizens can view their requests" ON pickup_requests
    FOR SELECT USING (
        citizen_id = auth.uid() OR 
        (assigned_vendor_id = auth.uid() AND EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'vendor'
        ))
    );

CREATE POLICY "Citizens can create requests" ON pickup_requests
    FOR INSERT WITH CHECK (
        citizen_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'citizen')
    );

CREATE POLICY "Citizens and vendors can update requests" ON pickup_requests
    FOR UPDATE USING (
        citizen_id = auth.uid() OR 
        (assigned_vendor_id = auth.uid() AND EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'vendor'
        ))
    );

-- Bills policies
CREATE POLICY "Users can view their bills" ON bills
    FOR SELECT USING (citizen_id = auth.uid() OR vendor_id = auth.uid());

CREATE POLICY "Vendors can create bills" ON bills
    FOR INSERT WITH CHECK (
        vendor_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'vendor')
    );
