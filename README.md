# QuickPitch 🎤

AI-powered pitch practice platform with real-time video feedback. Practice your elevator pitch, sales presentation, or any speaking scenario with AI-driven insights and video recording capabilities.

## Features

- 🎥 **Video Recording** - Record your pitch with Agora RTC
- 🤖 **AI Feedback** - Get instant feedback from OpenAI GPT-4
- 📊 **Performance Analytics** - Track your progress over time
- 🎯 **Custom Scenarios** - Practice different pitch types
- 🔐 **Secure Authentication** - User accounts with Supabase Auth
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI Components:** shadcn/ui, Radix UI
- **Styling:** Tailwind CSS
- **Video:** Agora RTC SDK
- **AI:** OpenAI GPT-4 API
- **Backend:** Supabase (Auth, Database, Storage)
- **State Management:** TanStack Query
- **Routing:** React Router v6

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- OpenAI API key
- Agora.io account (optional, for video features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/magnusfroste/quickpitch.git
cd quickpitch
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
VITE_OPENAI_API_KEY=your-openai-api-key-here
VITE_OPENAI_ASSISTANT_ID=your-assistant-id-here
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Set up authentication (Email/Password or OAuth)
3. Create the necessary database tables (schema provided in `supabase/` folder)
4. Copy your project URL and anon key to `.env`

### OpenAI Setup

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an Assistant for pitch feedback
3. Add the API key and Assistant ID to `.env`

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## How It Works

1. **Record Your Pitch** - Use the video recorder to capture your presentation
2. **AI Analysis** - OpenAI analyzes your content, delivery, and structure
3. **Get Feedback** - Receive detailed feedback on improvements
4. **Track Progress** - Monitor your improvement over time

## Project Structure

```
quickpitch/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and API clients
│   └── pages/          # Page components
├── supabase/           # Database schema
└── public/             # Static assets
```

## License

MIT License - feel free to use this for your own pitch practice!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on GitHub.
