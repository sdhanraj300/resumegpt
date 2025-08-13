<h1 align="center">
  Resume GPT 📄✨
</h1>

<h3 align="center">
  Your AI-Powered Career Co-Pilot
</h3>

<p align="center">
  Leveraging the power of Large Language Models to provide intelligent, context-aware analysis of your resume. Ask questions, get insights, and prepare for your career move—all through a real-time, interactive chat interface.
</p>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![LangChain.js](https://img.shields.io/badge/LangChain-JS-blue.svg)](https://js.langchain.com/)

</div>

<br>

<div align="center">
  <p><em><img width="2560" height="1600" alt="image" src="https://github.com/user-attachments/assets/068e4176-35e1-47a2-9240-45d117c299cf" />
</em></p>
</div>

## 🤔 What is Resume GPT?

Resume GPT is a full-stack AI application designed to act as a career co-pilot. It goes beyond simple keyword matching by implementing a multi-step **Retrieval-Augmented Generation (RAG)** pipeline. This allows it to deeply understand the content of a PDF resume and provide accurate, nuanced answers to a user's follow-up questions.

## ✨ Key Features

- **🧠 Intelligent Resume Analysis:** Upload your resume and get an instant, AI-powered summary and analysis.
- **💬 Interactive Chat Interface:** Ask specific follow-up questions about your resume in a real-time, streaming chat.
- **🔗 Advanced RAG Pipeline:** Utilizes LangChain.js to create a sophisticated pipeline that retrieves relevant context before generating answers, ensuring high accuracy.
- **🔐 Secure Authentication:** User accounts and session management handled by **NextAuth.js**.
- **💾 Dual-Database Architecture:** Integrates **Pinecone** for high-speed vector storage and semantic search, with **PostgreSQL (Neon)** and **Prisma** for managing relational data like user profiles and chat history.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **AI/LLMs:** [LangChain.js](https://js.langchain.com/), [Google Gemini](https://ai.google.dev/)
- **Vector Database:** [Pinecone](https://www.pinecone.io/)
- **Relational Database:** [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/))
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Schema Validation:** [Zod](https://zod.dev/)
- **Deployment:** [Vercel](https://vercel.com/)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- An account with Pinecone, Google (for Gemini API), and a PostgreSQL provider (like Neon).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/resume-gpt.git](https://github.com/your-username/resume-gpt.git)
    cd resume-gpt
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of your project and add the necessary API keys and database URLs. You can use `.env.example` as a template.
    ```env
    GOOGLE_API_KEY=
    PINECONE_API_KEY=
    PINECONE_ENVIRONMENT=
    DATABASE_URL=
    
    NEXTAUTH_SECRET=
    NEXTAUTH_URL=
    # Add any other variables from your project
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/resume-gpt/issues).

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
