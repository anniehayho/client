import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import ioClient from 'socket.io-client';
import { BE_API_URL } from '../../const';

const Register = () => {
  // Initial form state
  const initialFormState = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Memoize API URL
  const API_URL = useMemo(() => `${BE_API_URL}`, []);

  // Validation rules
  const validationRules = useMemo(() => ({
    password: {
      minLength: 6,
      message: 'Password must be at least 6 characters long'
    },
    confirmPassword: {
      match: 'password',
      message: 'Passwords do not match'
    }
  }), []);

  // Memoize form validation
  const validateForm = useCallback(() => {
    // Password length check
    if (formData.password.length < validationRules.password.minLength) {
      setError(validationRules.password.message);
      return false;
    }

    // Password match check
    if (formData.password !== formData.confirmPassword) {
      setError(validationRules.confirmPassword.message);
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  }, [formData, validationRules]);

  // Memoize input change handler
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    setError('');
  }, []);

  // Memoize socket initialization
  const initializeSocket = useCallback((token) => {
    const socket = ioClient(API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        resolve(); // Don't reject, just proceed with navigation
      }, 3000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        console.error('Socket connection error:', err);
        resolve(); // Don't reject, just proceed with navigation
      });
    });
  }, [API_URL]);

  // Memoize submit handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registrationData } = formData;
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Initialize socket connection
      await initializeSocket(data.token);

      // Navigate to chat page
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, API_URL, navigate, initializeSocket]);

  // Memoize error alert component
  const ErrorAlert = useMemo(() => {
    if (!error) return null;

    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Registration failed</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }, [error]);

  // Common input class
  const inputClassName = "appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>

        {ErrorAlert}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="rounded-md shadow-sm space-y-4">
            {['username', 'email', 'password', 'confirmPassword'].map((field) => (
              <div key={field}>
                <label htmlFor={field} className="sr-only">
                  {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  id={field}
                  name={field}
                  type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                  autoComplete={field === 'email' ? 'email' : field === 'username' ? 'username' : undefined}
                  required
                  value={formData[field]}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              group relative w-full flex justify-center py-2 px-4 border border-transparent
              text-sm font-medium rounded-md text-white
              ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200
            `}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-sm text-center text-gray-600">
          By registering, you agree to our{' '}
          <button
            type="button"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            onClick={() => alert('Terms of Service not implemented yet')}
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            onClick={() => alert('Privacy Policy not implemented yet')}
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Register);