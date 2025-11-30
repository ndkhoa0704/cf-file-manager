# CF File Manager

A modern, full-featured file management system with chunked upload/download support, built with Vue.js and Express.js.

## Features

- 🔐 **User Authentication** - Secure login with JWT tokens
- 📁 **File Management** - Browse, upload, download, delete, rename files and folders
- 📤 **Chunked Upload** - Upload large files (up to 5GB) in chunks for better reliability
- 📥 **Chunked Download** - Download large files efficiently in chunks
- 👥 **User Management** - Admin panel for managing users
- 🔒 **Path Validation** - Secure path validation to prevent directory traversal attacks
- 💾 **SQLite Database** - Lightweight database for user and session management
- 🎨 **Modern UI** - Clean and intuitive Vue.js interface

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** (better-sqlite3) for database
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

### Frontend
- **Vue.js 3** with Composition API
- **Vue Router** for navigation
- **Pinia** for state management
- **Axios** for API calls
- **Vite** for build tooling

## Project Structure

```
cf-file-manager/
├── client/                 # Vue.js frontend application
│   ├── src/
│   │   ├── api/           # API client configuration
│   │   ├── components/    # Vue components
│   │   ├── router/        # Vue Router configuration
│   │   ├── stores/        # Pinia stores (auth, files)
│   │   ├── views/         # Page views (Login, Files, Admin)
│   │   └── styles/        # Global styles
│   └── dist/              # Production build output
├── server/                # Express.js backend application
│   ├── src/
│   │   ├── config/        # Configuration settings
│   │   ├── database/      # Database initialization
│   │   ├── middleware/    # Authentication middleware
│   │   ├── models/        # Data models (User, UploadSession)
│   │   ├── routes/        # API routes (auth, files, users)
│   │   └── utils/         # Utility functions
│   ├── data/              # SQLite database file
│   ├── storage/           # User file storage
│   └── scripts/           # Utility scripts (create-admin)
└── package.json           # Root package.json with convenience scripts
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cf-file-manager
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   This will install dependencies for root, server, and client.

3. **Create an admin user**
   ```bash
   npm run create-admin
   ```
   Follow the prompts to create your first admin account.

## Configuration

### Environment Variables

Create a `.env` file in the `server` directory (optional):

```env
PORT=3123
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

If not set, defaults are:
- **PORT**: 3123
- **JWT_SECRET**: `your-super-secret-jwt-key-change-in-production` (⚠️ Change in production!)

### Server Configuration

Default settings in `server/src/config/index.js`:
- **Chunk Size**: 100MB
- **Max File Size**: 5GB
- **JWT Expiration**: 24 hours

## Usage

### Development Mode

Run both server and client in development mode:

```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:3123`
- Frontend dev server (usually on `http://localhost:5173`)

Or run them separately:

```bash
# Backend only
npm run dev:server

# Frontend only
npm run dev:client
```

### Production Mode

1. **Build the client**
   ```bash
   npm run build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

   Or build and start in one command:
   ```bash
   npm run start:prod
   ```

The server will serve the built frontend from `client/dist` and handle API requests.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/me` - Get current user info

### Files
- `GET /api/files/list` - List files in a directory
- `POST /api/files/mkdir` - Create a directory
- `DELETE /api/files/delete` - Delete file or directory
- `POST /api/files/rename` - Rename file or directory
- `POST /api/files/upload/init` - Initialize chunked upload
- `POST /api/files/upload/chunk` - Upload a chunk
- `POST /api/files/upload/complete` - Complete upload (merge chunks)
- `POST /api/files/upload/cancel` - Cancel upload session
- `GET /api/files/download/info` - Get file info for chunked download
- `GET /api/files/download/chunk` - Download a chunk
- `GET /api/files/download` - Direct download (for small files)

### Users (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/password` - Update user password

## Features in Detail

### Chunked Upload
Large files are uploaded in 100MB chunks, allowing for:
- Resume capability (if implemented)
- Better error handling
- Progress tracking
- Reduced memory usage

### Security
- Path validation prevents directory traversal attacks
- JWT-based authentication
- Password hashing with bcrypt
- User isolation (each user has their own storage directory)
- Admin-only routes protection

### User Roles
- **user**: Regular user with access to their own files
- **admin**: Can manage users and access admin panel

## Development

### Creating an Admin User

```bash
npm run create-admin
```

### Database

The application uses SQLite. The database file is located at `server/data/database.sqlite`. It's automatically initialized on first run.

### Storage

User files are stored in `server/storage/<username>/`. Each user has their own isolated directory.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

