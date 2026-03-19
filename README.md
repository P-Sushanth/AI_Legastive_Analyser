---
title: Citizen Policy Chatbot
emoji: ⚖️
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# ⚖️ Citizen Policy Chatbot

An AI-powered dashboard designed to help citizens understand complex legal documents by leveraging **high-density token compression** and **automatic document routing**.

## 🚀 Key Features

*   **⚡ High-Density Compression**: Powered by [ScaleDown.ai](https://scaledown.ai), our pipeline compresses massive legal documents (e.g., the Constitution of India ~213k tokens) by up to **92%** while preserving critical meaning.
*   **🤖 Natural Language Routing**: No need to manually select a PDF! Simply ask a question like *"What are my fundamental rights?"* or *"Tell me about the 2023 Telecom Act,"* and the system will automatically identify and process the relevant document.
*   **📊 Real-time Summaries**: Upon document selection (optional) or query, the system generates a "Policy Quick Summary" optimized for common citizen understanding.
*   **📉 Usage Analytics**: Track token consumption, information density, and financial savings ($USD) in real-time via the sidebar.

## 🛠️ Technologies Used

*   **Backend**: [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/)
*   **PDF Processing**: [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/)
*   **Encoding**: [tiktoken](https://github.com/openai/tiktoken)
*   **Compression Engine**: [ScaleDown.ai API](https://docs.scaledown.ai)
*   **AI Model**: OpenAI GPT-5.4-mini (via ScaleDown SDK)
*   **Frontend**: Vanilla HTML5, CSS3 (Modern Dark Mode), JavaScript (ES6+)

## 💻 How to Run Locally

### 1. Prerequisites
- Python 3.9 or higher
- ScaleDown.ai API Key ([Get one here](https://docs.scaledown.ai))
- OpenAI API Key

### 2. Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd Law-Project

# Create and activate virtual environment
python -m venv venv
# On Windows
venv\Scripts\activate
# On Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
To enable the full AI pipeline, ensure the following environment variables are set:
```bash
export SCALEDOWN_API_KEY="your_scaledown_key"
export OPENAI_API_KEY="your_openai_key"
```

### 4. Launch
```bash
python main.py
```
The dashboard will be available at `http://localhost:8000`.

## 📂 Project Structure

- `dataset/`: Contains 100k+ token legal PDFs (Constitution, RTI, Telecom Act, etc.)
- `pipeline.py`: Core logic for text extraction, automatic document routing, and ScaleDown compression.
- `main.py`: FastAPI application serving the API and static frontend.
- `static/`: Modern web dashboard source files.

---

## 🏗️ Architecture Overview

1.  **User Input**: User asks a question or selects a document.
2.  **Routing**: The system identifies the most relevant PDF in the `dataset/` folder.
3.  **Extraction**: Full text is extracted from the 100k+ token document.
4.  **Compression**: ScaleDown.ai maps the context to a high-density prompt buffer.
5.  **Generation**: The LLM provides a targeted, cost-efficient answer.

---
*Developed for the Scaledown.ai Hackathon.*
