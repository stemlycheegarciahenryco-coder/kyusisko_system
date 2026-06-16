import { useState } from 'react';
import api from './api';

export const useOrganization = () => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [formData, setFormData] = useState({
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
    tel_number: '',
    website: '',
    provider_type: ''
  });

  // --- OTP VERIFICATION HANDLERS ---
  const handleRequestOtp = async () => {
    if (!formData.sub_email) return { error: "Please enter an email address." };
    setVerifying(true);
    try {
        await api.post('/onboarding-orgs/request-otp', { email: formData.sub_email });
        return { success: true };
    } catch (err) {
        return { error: err.response?.data?.error || "Error sending code" };
    } finally {
        setVerifying(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    setVerifying(true);
    try {
        await api.post('/onboarding-orgs/verify-otp', { email: formData.sub_email, otp });
        setIsVerified(true);
        return { success: true };
    } catch (err) {
        return { error: err.response?.data?.error || "Invalid code" };
    } finally {
        setVerifying(false);
    }
  };

  // --- STANDARD NEW ONBOARDING REGISTRATION (Pure JSON request) ---
  const handleOnboard = async () => {
    setLoading(true);
    try {
      // Send text fields over directly as a standard JSON body payload
      await api.post('/onboarding-orgs/register-organization', formData, {
        headers: { 'Content-Type': 'application/json' }
      });

      resetForm();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  // --- COMPLIANCE SUBMIT: Keeps multi-part file layout for System Admin tasks ---
  const handleComplianceSubmit = async (orgId, complianceFiles) => {
    setLoading(true);
    try {
      const data = new FormData();
      const fileFields = ['proof', 'sec_file', 'valid_id'];
      
      fileFields.forEach(field => {
        if (complianceFiles[field] && complianceFiles[field].length > 0) {
          complianceFiles[field].forEach((file) => {
            data.append(field, file);
          });
        }
      });

      const response = await api.post(`/onboarding-orgs/comply/${orgId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return { success: true, message: response.data.message };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || "Failed to process compliance submission." 
      };
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      org_name: '', first_name: '', middle_name: '', last_name: '', 
      sub_email: '', region: '', city: '', barangay: '', 
      street_address: '', sub_password: '', confirm_password: '', 
      contact_number: '', tel_number: '', website: '', provider_type: ''
    });
    setIsVerified(false);
  };

  return { 
    loading, verifying, isVerified, formData, setFormData, 
    handleOnboard, handleRequestOtp, handleVerifyOtp, handleComplianceSubmit
  };
};