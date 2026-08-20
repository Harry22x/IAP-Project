import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function LogIn() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    try {
      // create token
      const tokenResponse = await api.post('/auth/token/', {
        email: formData.email,
        password: formData.password,
      });

      const { access, refresh } = tokenResponse.data;

      // store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      const userResponse = await api.get('/auth/me/');
      const { role, name } = userResponse.data;

      const userRole = userResponse.data.role;

      // store user role locally for easy frontend usage
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('user_name', name);

      // redirect based on role
      if (userRole === 'COORDINATOR') {
        navigate('/tc');
      } else if (userRole === 'HEALTHCARE_PROFESSIONAL') {
        navigate('/hp');
      } else if (userRole === 'ADMINISTRATOR') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        'Invalid credentials. Please try again.'
      );
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
            Welcome Back !
          </h2>

          {error && <p className="text-red-500 text-center">{error}</p>}

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
            Log In
          </button>
          <p className="text-sm text-center text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#042d6d] hover:underline">
              Register here!
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default LogIn;