
# Auth API Postman Collection and Frontend Integration Guide

## Introduction

This document provides a Postman collection for the authentication routes and a guide on how to integrate them into a frontend application.

To use the Postman collection, click the "Import" button in Postman and paste the JSON from this file. It is recommended to set up a Postman environment with a `baseURL` variable (e.g., `https://anibha.onrender.com`) to easily switch between environments.

## Postman Collection

```json
{
	"info": {
		"_postman_id": "a8c5b5f2-91e8-4b96-a602-5a263c78a03c",
		"name": "Auth API",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "Signup",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "Content-Type",
						"value": "application/json",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"name\": \"Test User\",\n    \"email\": \"test@example.com\",\n    \"password\": \"password123\"\n}"
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/auth/signup",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"auth",
						"signup"
					]
				}
			},
			"response": []
		},
		{
			"name": "Login",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "Content-Type",
						"value": "application/json",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"email\": \"test@example.com\",\n    \"password\": \"password123\"\n}"
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/auth/login",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"auth",
						"login"
					]
				}
			},
			"response": []
		},
		{
			"name": "Logout",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "x-access-token",
						"value": "{{authToken}}",
						"type": "text"
					}
				],
				"url": {
					"raw": "{{baseURL}}/api/v1/auth/logout",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"auth",
						"logout"
					]
				}
			},
			"response": []
		},
		{
			"name": "Get Me",
			"request": {
				"method": "GET",
				"header": [
					{
						"key": "Authorization",
						"value": "Bearer {{authToken}}",
						"type": "text"
					}
				],
				"url": {
					"raw": "{{baseURL}}/api/v1/auth/me",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"auth",
						"me"
					]
				}
			},
			"response": []
		},
		{
			"name": "Forgot Password",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "Content-Type",
						"value": "application/json",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"email\": \"test@example.com\"\n}"
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/auth/forgot-password",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"auth",
						"forgot-password"
					]
				}
			},
			"response": []
		},
		{
			"name": "Verify Forgot OTP",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "Content-Type",
						"value": "application/json",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"email\": \"test@example.com\",\n    \"otp\": \"123456\"\n}"
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/auth/verify-forgot-otp",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"auth",
						"verify-forgot-otp"
					]
				}
			},
			"response": []
		},
		{
			"name": "Reset Password",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "Content-Type",
						"value": "application/json",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"email\": \"test@example.com\",\n    \"otp\": \"123456\",\n    \"newPassword\": \"newPassword456\"\n}"
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/auth/reset-password",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"auth",
						"reset-password"
					]
				}
			},
			"response": []
		},
		{
			"name": "Change Password",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "Content-Type",
						"value": "application/json",
						"type": "text"
					},
					{
						"key": "Authorization",
						"value": "Bearer {{authToken}}",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"oldPassword\": \"password123\",\n    \"newPassword\": \"newPassword456\"\n}"
				},
				"url": {
					"raw": "{{baseURL}}/api/v1/auth/change-password",
					"host": [
						"{{baseURL}}"
					],
					"path": [
						"api",
						"v1",
						"auth",
						"change-password"
					]
				}
			},
			"response": []
		}
	]
}
```

## Frontend Integration Logic

### 1. Setup

It's good practice to have a dedicated service or a set of utility functions for handling API calls.

```javascript
// a basic example using axios
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://anibha.onrender.com/api/v1', // Your API base URL
});

// Function to set the auth token for subsequent requests
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};
```

### 2. Authentication Flow

#### Signup

- Call the `POST /auth/signup` endpoint with the user's name, email, and password.
- After a successful signup, the user will receive an OTP to verify their email. You should implement a separate OTP verification step.

#### Login

- Make a `POST` request to `/auth/login` with the user's email and password.
- The authentication token will be in the `x-access-token` header of the response.
- Store this token securely, for example, in `localStorage`.
- Use the `setAuthToken` function (from the setup section) to add this token to the headers of all future requests.

```javascript
const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    const token = response.headers['x-access-token'];
    localStorage.setItem('authToken', token);
    setAuthToken(token);
    // Redirect to a protected route or update the UI
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

#### Logout

- Make a `POST` request to `/auth/logout`.
- This endpoint will invalidate the token on the server-side.
- On the client-side, remove the token from `localStorage` and clear the authorization header.

```javascript
const logout = () => {
  localStorage.removeItem('authToken');
  setAuthToken(null);
  // Redirect to the login page
};
```

### 3. Making Authenticated Requests

For any endpoint that requires authentication, ensure the `Authorization` header is set with the Bearer token. If you are using the `setAuthToken` function, this will be handled automatically.

Example: Fetching user profile information.

```javascript
const getMyProfile = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    console.log(response.data); // The user's profile data
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};
```

### 4. Password Management

#### Forgot Password

1.  The user enters their email address.
2.  Call `POST /auth/forgot-password` with the email.
3.  The backend will send an OTP to the user's email.

#### Verify OTP and Reset Password

1.  The user enters the OTP and their new password.
2.  You can either have a single "reset password" step or a two-step process (verify OTP first, then reset password).
    *   **Two-step:**
        1.  Call `POST /auth/verify-forgot-otp` with the email and OTP.
        2.  If successful, show a form for the new password and call `POST /auth/reset-password` with the email, OTP, and `newPassword`.
    *   **One-step:**
        1.  Call `POST /auth/reset-password` with the email, OTP, and `newPassword`.

#### Change Password (for logged-in users)

- For users who are already logged in and want to change their password.
- Make an authenticated `POST` request to `/auth/change-password` with `oldPassword` and `newPassword`.
