# AI-Powered Matchmaking Application

A modern matchmaking application that uses AI to connect users based on compatibility, personality traits, and shared interests.

## Features

### Core Features

- **User Authentication**: Secure registration and login with email/password and social login options.
- **User Profiles**: Detailed profiles with personal information, interests, and preferences.
- **AI Matchmaking**: Sophisticated algorithm that matches users based on multiple compatibility factors.
- **Chat System**: Real-time messaging between matched users.
- **Subscription Management**: Tiered subscription plans with different features and benefits.

### Advanced Features

#### 1. Enhanced AI Matching Algorithm with OpenAI Integration

Our sophisticated matching algorithm leverages OpenAI's powerful language models to create high-quality matches:

- **AI-Powered Compatibility Analysis**: Uses GPT-4o to analyze user profiles and determine compatibility.
- **Semantic Understanding**: The AI understands nuances in user profiles beyond simple attribute matching.
- **Personalized Explanations**: Generates detailed, human-like explanations for why users were matched.
- **Embedding-Based Matching**: Uses OpenAI's text embeddings to find users with similar interests and values.
- **Fallback Mechanism**: Includes a rule-based algorithm as a fallback if the OpenAI API is unavailable.
- **Tiered Analysis**: Premium users get more comprehensive AI analysis than free users.

#### 2. Profile Verification System

Multi-layered verification system to ensure user authenticity and safety:

- **Email Verification**: Basic verification of user's email address.
- **Phone Verification**: SMS-based verification of user's phone number.
- **Social Media Verification**: Linking and verification of social media profiles.
- **ID Verification**: Upload and verification of government-issued ID.
- **Photo Verification**: Facial recognition to verify profile photos match the user.
- **Verification Score**: Composite score based on completed verifications.
- **Verification Badges**: Visual indicators of verification level (Bronze, Silver, Gold, Platinum).

#### 3. User Reporting System

Comprehensive system for reporting inappropriate behavior:

- **Multiple Report Categories**: Options for reporting different types of violations.
- **Evidence Collection**: Ability to submit screenshots or other evidence.
- **Admin Review Process**: Backend system for reviewing and acting on reports.
- **User Protection**: Measures to protect users from harassment and scams.
- **Feedback Loop**: Users are notified when their reports are resolved.

#### 4. Admin Dashboard

Comprehensive admin interface for platform management:

- **Overview Dashboard**: Real-time statistics and key metrics at a glance.
- **User Management**: Tools to view, edit, and moderate user accounts.
- **Report Handling**: System for reviewing and resolving user reports.
- **Analytics**: Detailed insights into platform performance and user engagement.
- **Content Moderation**: Tools to monitor and moderate user-generated content.

#### 5. Push Notification System

Real-time notification system to keep users engaged:

- **Match Notifications**: Alerts for new matches and compatibility scores.
- **Message Alerts**: Notifications for new messages from matches.
- **Profile Views**: Alerts when someone views your profile.
- **Verification Updates**: Notifications about verification status changes.
- **System Announcements**: Platform updates and important information.
- **Preference Management**: User controls for notification types and frequency.

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Authentication**: NextAuth.js
- **Real-time Communication**: Socket.io
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: OpenAI API (GPT-4o and Embeddings)
- **Deployment**: Vercel (or your preferred hosting platform)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- MongoDB database
- OpenAI API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/matchmaking-app.git
   cd matchmaking-app
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables:

   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Running in Production

1. Build the application:

   ```bash
   npm run build
   # or
   yarn build
   ```

2. Start the production server:

   ```bash
   npm start
   # or
   yarn start
   ```

### Docker Deployment (Optional)

1. Build the Docker image:

   ```bash
   docker build -t matchmaking-app .
   ```

2. Run the container:

   ```bash
   docker run -p 3000:3000 -e MONGODB_URI=your_mongodb_uri -e NEXTAUTH_SECRET=your_secret -e OPENAI_API_KEY=your_key matchmaking-app
   ```

## Application Structure

```
matchmaking-app/
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── admin/     # Admin dashboard pages
│   │   ├── api/       # API routes
│   │   ├── auth/      # Authentication pages
│   │   ├── dashboard/ # User dashboard
│   │   ├── matches/   # Match viewing pages
│   │   └── profile/   # Profile management
│   ├── components/    # Reusable React components
│   ├── lib/           # Utility functions and services
│   │   ├── ai/        # AI integration services
│   │   ├── db/        # Database models and connections
│   │   └── services/  # Application services
│   └── styles/        # Global styles
├── .env.local         # Environment variables (create this)
├── next.config.js     # Next.js configuration
└── package.json       # Project dependencies
```

## OpenAI Integration

This application uses OpenAI's API for enhanced matchmaking capabilities:

### API Usage

- **Chat Completions API**: Used for analyzing user compatibility and generating match explanations.
- **Embeddings API**: Used for creating vector representations of user profiles to find similar users.

### Cost Considerations

The application is designed to minimize API costs while maximizing value:

- Free tier users receive limited AI analysis (3 potential matches analyzed per request).
- Premium users receive more comprehensive AI analysis (10 potential matches analyzed per request).
- Embeddings are used for initial filtering to reduce the number of detailed analyses needed.
- A rule-based fallback system ensures the app functions even if the OpenAI API is unavailable.

### Configuration

To use the OpenAI integration, you must provide a valid API key in the `.env.local` file. You can obtain an API key from the [OpenAI platform](https://platform.openai.com/).

## User Guide

### For End Users

1. **Registration**: Create an account using email or social login.
2. **Profile Setup**: Complete your profile with personal details, interests, and preferences.
3. **Verification**: Verify your identity through various methods to increase trust.
4. **Discover Matches**: Browse AI-suggested matches based on compatibility.
5. **Connect**: Message your matches and build connections.
6. **Subscription**: Upgrade to premium for enhanced features.

### For Administrators

1. **Dashboard**: Access the admin dashboard at `/admin/dashboard`.
2. **User Management**: Manage users at `/admin/users`.
3. **Reports**: Handle user reports at `/admin/reports`.
4. **Analytics**: View platform analytics at `/admin/analytics`.
5. **Matches**: Monitor match quality at `/admin/matches`.

## Troubleshooting

### Common Issues

- **API Connection Errors**: Ensure your MongoDB URI and OpenAI API key are correct.
- **Authentication Issues**: Verify your NextAuth configuration in `.env.local`.
- **Missing Matches**: Check that the AI matching service is properly configured.

### Support

For additional help, please open an issue on the GitHub repository or contact the development team.

## Future Enhancements

- **Advanced Analytics**: User engagement metrics and success rate tracking.
- **Machine Learning**: Continuous improvement of matching algorithm based on user feedback.
- **Video Chat**: Integrated video calling for virtual dates.
- **Mobile App**: Native mobile applications for iOS and Android.
- **Internationalization**: Support for multiple languages and regions.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [OpenAI](https://openai.com/)
