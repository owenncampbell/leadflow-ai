# LeadFlow AI

LeadFlow AI is an AI-powered lead management tool for contracting businesses. It helps analyze new project requests, providing a concise summary, cost estimates, material lists, and more, to streamline the initial lead qualification process.

## Features

- **AI-Powered Lead Analysis:** Uses OpenAI's GPT-3.5-turbo to analyze project descriptions.
- **Secure Authentication:** JWT-based authentication system to protect user data.
- **Lead Management Dashboard:** A simple UI to view, manage, and track the status of all your leads.
- **PDF Proposal Generation:** Automatically generate a professional-looking project proposal PDF from a lead's details.

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js, Express.js, MongoDB (with Mongoose)
- **AI:** OpenAI API
- **Testing:** Jest, Supertest, MongoDB-Memory-Server

## Project Structure

```
/
├── backend/
│   ├── config/         # Database configuration
│   ├── controllers/    # Route handler logic
│   ├── middleware/     # Custom middleware (e.g., auth)
│   ├── models/         # Mongoose schemas and models
│   ├── routes/         # API route definitions
│   ├── __tests__/      # Backend tests
│   ├── .env.example    # Example environment variables
│   ├── package.json
│   └── server.js       # Main server entry point
└── frontend/
    ├── config.js       # Frontend configuration (e.g., API URL)
    ├── index.html
    ├── script.js
    └── style.css
```

## Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (or a MongoDB Atlas account)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd leadflow-ai
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create a .env file from the example
cp .env.example .env
```

Now, open `backend/.env` and fill in the required environment variables:

- `MONGODB_URI`: Your MongoDB connection string.
- `OPENAI_API_KEY`: Your API key from OpenAI.
- `JWT_SECRET`: A long, random, and secret string for signing tokens.

### 3. Frontend Setup

The frontend has no build step. You just need to ensure the API URL is pointing to the correct location. Open `frontend/config.js` and change `API_URL` if your backend is not running on the default port.

## Running the Application

1.  **Start the Backend Server:**

    ```bash
    cd backend
    npm start
    ```

    The server will start on `http://localhost:3000` by default.

2.  **Run the Frontend:**

    Simply open the `frontend/index.html` file in your web browser.

## Running Tests

To run the backend test suite:

```bash
cd backend
npm test
```
