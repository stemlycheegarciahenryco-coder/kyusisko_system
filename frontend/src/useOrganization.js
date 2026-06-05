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
    website: '',
    provider_type: '',
    proof: [],
    sec_file: [],
    valid_id: [],
    org_pic: null // Added profile picture tracking safely here
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

  // --- STANDARD NEW ONBOARDING REGISTRATION ---
  const handleOnboard = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      const fileArrayFields = ['proof', 'sec_file', 'valid_id'];

      // Append text fields cleanly
      Object.keys(formData).forEach(key => {
        if (!fileArrayFields.includes(key) && key !== 'org_pic') {
          data.append(key, formData[key] || '');
        }
      });

      // Append multiple requirement files arrays
      fileArrayFields.forEach(field => {
        if (formData[field] && formData[field].length > 0) {
          formData[field].forEach((file) => {
            data.append(field, file);
          });
        }
      });

      // Append standalone profile image if tracking state contains one
      if (formData.org_pic) {
        data.append('org_pic', formData.org_pic);
      }

      await api.post('/onboarding-orgs/register-organization', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      resetForm();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  // --- FIXED: COMPLIANCE HANDLER IS NOW SEPARATE AND SCOPED CORRECTLY ---
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
      contact_number: '', website: '', provider_type: '',
      proof: [], sec_file: [], valid_id: [], org_pic: null
    });
    setIsVerified(false);
  };

  return { 
    loading, 
    verifying, 
    isVerified, 
    formData, 
    setFormData, 
    handleOnboard, 
    handleRequestOtp, 
    handleVerifyOtp,
    handleComplianceSubmit
  };
};