export const createSubDTO = (formData) => {
  return {
    org_name: formData.org_name,
    first_name: formData.first_name,
    middle_name: formData.middle_name || null,
    last_name: formData.last_name,
    sub_email: formData.sub_email,
    sub_password: formData.sub_password,
    contact_number: formData.contact_number,
    website: formData.website || null,
    // Pass the new address strings
    region: formData.region,
    city: formData.city,
    barangay: formData.barangay,
    street_address: formData.street_address,
    provider_type: formData.provider_type,
    ability_level: '1'
  };
};