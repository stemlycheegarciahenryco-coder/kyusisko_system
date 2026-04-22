import { useState } from 'react';
import api from './api';
import { createSubDTO } from './DTO/createSubDTO';

export const useOrganization = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    org_name: '',
    first_name: '',
    middle_name: '', 
    last_name: '',
    sub_email: '',
    // Added new address fields
    region: '',
    city: '',
    barangay: '',
    street_address: '',
    sub_password: '',
    confirm_password: '',
    contact_number: '',
    website: '' // Added website as well since it's in your UI
  });

  const handleOnboard = async () => {
    setLoading(true);
    try {
      const dataToSend = createSubDTO(formData);
      await api.post('/onboarding/register-organization', dataToSend); 
      
      alert("Registration successful! Please check your email to verify your account.");
      resetForm();
      return true;
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      org_name: '', 
      first_name: '', 
      middle_name: '', 
      last_name: '', 
      sub_email: '', 
      region: '',
      city: '',
      barangay: '',
      street_address: '',
      sub_password: '', 
      confirm_password: '',
      contact_number: '',
      website: ''
    });
  };

  return { loading, formData, setFormData, handleOnboard };
};