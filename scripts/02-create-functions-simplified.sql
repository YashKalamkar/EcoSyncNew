-- Simplified function to get available requests for vendors
CREATE OR REPLACE FUNCTION get_vendor_available_requests(vendor_uuid UUID)
RETURNS TABLE (
    id UUID,
    citizen_id UUID,
    citizen_name TEXT,
    citizen_address TEXT,
    citizen_contact TEXT,
    waste_type waste_type,
    weight_category weight_category,
    approximate_weight DECIMAL,
    waste_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.citizen_id,
        p.name as citizen_name,
        p.address as citizen_address,
        p.contact as citizen_contact,
        pr.waste_type,
        pr.weight_category,
        pr.approximate_weight,
        pr.waste_photo_url,
        pr.created_at
    FROM pickup_requests pr
    JOIN profiles p ON pr.citizen_id = p.id
    WHERE pr.status = 'pending'
    AND pr.waste_type IN (
        SELECT vwt.waste_type 
        FROM vendor_waste_types vwt 
        WHERE vwt.vendor_id = vendor_uuid
    )
    ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign vendor to request (simplified)
CREATE OR REPLACE FUNCTION assign_vendor_to_request(
    request_uuid UUID,
    vendor_uuid UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE pickup_requests 
    SET 
        assigned_vendor_id = vendor_uuid,
        status = 'assigned',
        updated_at = NOW()
    WHERE id = request_uuid 
    AND status = 'accepted';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplified bill creation function
CREATE OR REPLACE FUNCTION create_bill_for_request(
    request_uuid UUID,
    actual_weight_param DECIMAL
) RETURNS UUID AS $$
DECLARE
    bill_id UUID;
    request_data RECORD;
    rate_per_kg DECIMAL;
    gross_amt DECIMAL;
    net_amt DECIMAL;
BEGIN
    -- Get request data
    SELECT pr.*, p.name as citizen_name
    INTO request_data
    FROM pickup_requests pr
    JOIN profiles p ON pr.citizen_id = p.id
    WHERE pr.id = request_uuid;
    
    -- Get rate for waste type from vendor
    SELECT vwt.price_per_kg INTO rate_per_kg
    FROM vendor_waste_types vwt
    WHERE vwt.vendor_id = request_data.assigned_vendor_id
    AND vwt.waste_type = request_data.waste_type;
    
    -- Use default rate if not found
    IF rate_per_kg IS NULL THEN
        rate_per_kg := 5.00;
    END IF;
    
    -- Calculate amounts
    gross_amt := actual_weight_param * rate_per_kg;
    net_amt := gross_amt - 10.00; -- Platform fee of Rs 10
    
    -- Insert bill
    INSERT INTO bills (
        request_id,
        citizen_id,
        vendor_id,
        waste_type,
        actual_weight,
        rate_per_kg,
        gross_amount,
        platform_fee,
        net_amount
    ) VALUES (
        request_uuid,
        request_data.citizen_id,
        request_data.assigned_vendor_id,
        request_data.waste_type,
        actual_weight_param,
        rate_per_kg,
        gross_amt,
        10.00,
        net_amt
    ) RETURNING id INTO bill_id;
    
    -- Update request status
    UPDATE pickup_requests 
    SET 
        status = 'completed',
        actual_weight = actual_weight_param,
        updated_at = NOW()
    WHERE id = request_uuid;
    
    RETURN bill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
