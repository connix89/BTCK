from fastapi import FastAPI
from pydantic import BaseModel
from models import StepAnalysis
from mock_data import build_mock_analysis
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for frontend development
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeInput(BaseModel):
    code: str

class AnalysisResponse(BaseModel):
    rule: StepAnalysis
    llm: StepAnalysis

@app.post("/analyze", response_model=AnalysisResponse)
def analyze(code_input: CodeInput):
    data = build_mock_analysis(code_input.code)
    return data

@app.get("/")
def read_root():
    return {"message": "Backend is running. Use /analyze to post code."}
