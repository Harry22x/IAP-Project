import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    role: '',
    hosName: '',
    email: '',
    password: '',
    name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let backendRole = '';
    if (formData.role === 'tc') backendRole = 'COORDINATOR';
    if (formData.role === 'hp') backendRole = 'HEALTHCARE_PROFESSIONAL';

    if (!backendRole) {
      setError('Please select a valid role.');
      return;
    }

    try {
      await api.post('auth/register/', {
        role: backendRole,
        hospital_name: formData.hosName,
        email: formData.email,
        password: formData.password,
        name: formData.name || formData.email.split('@')[0],
      });

      navigate('/');
    } catch (err) {
      console.error('Registration Error:', err);
      
      const errorData = err.response?.data;
      if (errorData) {
        // Handle field-specific errors (common in DRF)
        if (typeof errorData === 'object' && !errorData.detail) {
          const errorMessages = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`)
            .join(' | ');
          setError(errorMessages);
        } else {
          setError(errorData.detail || 'Registration failed. Please check your data.');
        }
      } else {
        setError('Network error. Please ensure the backend is running.');
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center min-h-screen bg-[#042d6d]">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6"
        >
          <h2 className="text-2xl font-bold text-center text-[#042d6d]">
            Organ Donation Matching System
          </h2>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <div>
            <label className="block mb-1">Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042d6d]" required>
              <option value="">Select your role</option>
              <option value="tc">Transplant Coordinator</option>
              <option value="hp">Healthcare Professional</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Hospital Name</label>
            <input
              type="text"
              name="hosName"
              value={formData.hosName}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042d6d]"
              placeholder="Enter the name of the hospital"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042d6d]"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Email address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042d6d]"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042d6d]"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#042d6d] text-white font-semibold py-2 rounded-lg hover:bg-[#3871a0] transition"
          >
            Sign Up
          </button>

          <p className="text-sm text-center text-gray-500">
            Already have an account?{' '}
            <Link to="/" className="text-[#042d6d] hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;