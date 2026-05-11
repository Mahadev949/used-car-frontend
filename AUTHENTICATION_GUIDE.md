# Authentication System Guide

## ✅ Features Implemented

### Backend Authentication
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ User registration API
- ✅ User login API
- ✅ Token verification endpoint
- ✅ Protected routes with middleware
- ✅ Admin role-based access control

### Frontend Authentication
- ✅ Login page
- ✅ Register page
- ✅ Auth context for state management
- ✅ Protected routes
- ✅ Auto token refresh
- ✅ Logout functionality
- ✅ User info in navbar

## 🔐 API Endpoints

### Public Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Protected Endpoints
- `GET /api/auth/me` - Get current user info
- `GET /api/history` - Get prediction history (requires auth)
- `POST /api/predict` - Make prediction (works with or without auth)

### Admin Only Endpoints
- `POST /api/admin/retrain` - Retrain model
- `GET /api/admin/metrics` - Get model metrics
- `GET /api/admin/users` - Get all users

## 📝 Usage

### Register New User

```bash
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"  // optional, defaults to "user"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login

```bash
POST /api/auth/login
{
  "username": "john_doe",  // or email
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Using Protected Endpoints

Include token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 🎯 Frontend Usage

### Login Flow
1. User visits `/login`
2. Enters username/email and password
3. On success, token stored in localStorage
4. User redirected to home page
5. Navbar shows username and logout button

### Register Flow
1. User visits `/register`
2. Fills registration form
3. On success, automatically logged in
4. Redirected to home page

### Protected Routes
- `/user` - Requires authentication
- `/dealer` - Requires authentication
- `/admin` - Requires authentication + admin role

### Public Routes
- `/` - Landing page (public)
- `/login` - Login page (public)
- `/register` - Register page (public)
- `/datascience` - Data Science portal (public)

## 🔧 Configuration

### Backend `.env`
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
```

### Token Expiration
Currently set to 7 days. Can be changed in `backend/routes/auth.js`:
```javascript
{ expiresIn: '7d' }
```

## 🛡️ Security Features

1. **Password Hashing**: All passwords hashed with bcrypt (10 salt rounds)
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiration**: Tokens expire after 7 days
4. **Role-Based Access**: Admin routes protected
5. **Input Validation**: Username, email, password validation
6. **Error Handling**: Proper error messages without exposing sensitive info

## 📋 User Roles

- **user**: Regular user (default)
- **admin**: Administrator (can access admin portal)

## 🚀 Next Steps

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Start backend server:
   ```bash
   npm start
   ```

3. Frontend will automatically use authentication when you:
   - Visit `/login` or `/register`
   - Try to access protected routes
   - Make API calls (token auto-added to headers)

## 💡 Tips

- Tokens are stored in localStorage
- Token automatically added to all API requests
- On 401/403 errors, user automatically logged out
- Admin users see "(Admin)" badge in navbar
- Protected routes redirect to `/login` if not authenticated

