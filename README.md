# OAuth 2.0 Login & Custom Authentication with 2FA

## Description

This is a full-stack web application that implements OAuth 2.0 login (Google, Facebook), custom authentication with JWT-based email verification, password reset, and optional Two-Factor Authentication (2FA) using SMS (via Twilio or a similar service). The application is built using **React** for the frontend, **Node.js/Express** for the backend, and **MongoDB** for the database.

## Features

* **OAuth 2.0 Authentication**: Login via Google and Facebook.
* **Custom Authentication**: User registration and login with email and password.
* **Email Verification**: Users receive an email with a verification link after registration.
* **Password Reset**: Users can reset their password via email.
* **Two-Factor Authentication (2FA)**: Users can enable 2FA with their phone number, receiving OTP via SMS.
* **User Profile Management**: Users can edit their profile, change passwords, and enable/disable 2FA.
* **Responsive UI**: Built with React, the app provides a user-friendly and responsive interface.

## System Overview

![diagram](https://i.postimg.cc/C57h8kHY/Login-System-Overview-2.png)

## Tech Stack

### Frontend

* **React**: Frontend library for building the user interface.
* **Axios**: For making HTTP requests to the backend.
* **React Router**: Handles routing in the app.
* **CSS Modules**: Component-specific CSS for styling.

### Backend

* **Node.js/Express**: Backend framework for handling API requests and server-side logic.
* **JWT (JSON Web Token)**: For secure user authentication and session management.
* **Nodemailer**: To send emails for verification and password reset.
* **Twilio**: For sending SMS with OTP for 2FA (optional).
* **MongoDB**: NoSQL database to store user data.
* **Redis**: In memory key-value store to cache temporary redirection code.

### External Services

* **Google/Facebook OAuth**: For third-party authentication.
* **Twilio**: Used to send OTP for 2FA (alternatives can be integrated).

## Installation

### Prerequisites

* **Node.js** (v14+)
* **MongoDB** (local or cloud-based like MongoDB Atlas)
* **Twilio Account** (for sending SMS, optional)

### Steps to Run the Project

1. **Clone the Repository**:

       git clone https://github.com/tahmidhamim/oauth2.0-login.git
       cd oauth2.0-login

2. **Install Backend Dependencies**:

       cd server
       npm install

3. **Install Frontend Dependencies**:

       cd ../client
       npm install

4. **Environment Variables**: Create a `.env` file in the `server` folder and configure the following variables:

       MONGO_URI=your_mongo_database_uri
       JWT_SECRET=your_jwt_secret_key
       GOOGLE_CLIENT_ID=your_google_client_id
       GOOGLE_CLIENT_SECRET=your_google_client_secret
       FACEBOOK_APP_ID=your_facebook_app_id
       FACEBOOK_APP_SECRET=your_facebook_app_secret
       REDIS_URL=your_redis_server_url
       EMAIL_USER=your_email_service_username
       EMAIL_PASS=your_email_service_password_or_app_password
       TWILIO_ACCOUNT_SID=your_twilio_account_sid
       TWILIO_AUTH_TOKEN=your_twilio_auth_token
       TWILIO_PHONE_NUMBER=your_twilio_phone_number

5. **Running the Backend**:

       cd ../server
       npm start

6. **Running the Frontend**:

       cd ../client
       npm start

The frontend will be served on `http://localhost:3000` and the backend on `http://localhost:5000`.

### Testing

* **Unit Testing**: Add unit tests to ensure the correctness of components and APIs (if needed).
* **End-to-End Testing**: You can implement end-to-end testing using frameworks like Cypress or Selenium.

## Usage

1. **Register**: Create a new account with email and password. You will receive a verification email with a link to verify your account.
2. **Login**: After verifying your email, log in with your credentials or via Google/Facebook.
3. **Enable 2FA**: Once logged in, you can edit your profile to enable Two-Factor Authentication (2FA) by providing your phone number.
4. **Password Reset**: Use the "Forgot Password" option on the login page to receive a reset link.

## Project Structure

* **client/**: Frontend code (React)
    * `src/`: Contains all components, pages, and style-related files.
    * `index.js`: Entry point for the React app.
    * `App.js`: Defines routes and page navigation.
* **server/**: Backend code (Express)
    * `api/routes/`: API routes for authentication, user management, etc.
    * `api/models/`: MongoDB models (User, Token, etc.)
    * `api/email/`: Email service for verification and password reset.
    * `api/config/`: Configuration for passport authentication and database.

## Contributing

We welcome contributions to this project! To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Make your changes and commit (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-name`).
5. Create a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For any inquiries or issues, please contact [<tahmidhamim@gmail.com>].

## Live App

The app is live in this [link](https://oauth2-0-login-client.vercel.app/).