from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
from pipeline import get_available_pdfs, process_chat_message, summarize_document

app = FastAPI(title="Scaledown Custom UI Dashboard")

# Serve frontend statically
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("static/index.html")

@app.get("/api/documents")
async def get_documents():
    return {"documents": get_available_pdfs()}

class SummarizeRequest(BaseModel):
    pdf_filename: str

@app.post("/api/summarize")
async def invoke_summarize(req: SummarizeRequest):
    try:
         answer, metrics = summarize_document(req.pdf_filename)
         return {"answer": answer, "metrics": metrics}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    prompt: str
    pdf_filename: str = None

@app.post("/api/chat")
async def invoke_chat(req: ChatRequest):
    try:
         # Uses the REST API requests pipeline
         answer, metrics = process_chat_message(req.prompt, req.pdf_filename)
         return {"answer": answer, "metrics": metrics}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
