from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
load_dotenv()
from agents_graph import graph
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI(title="AI Market Research Analyst API")

# Setup CORS to allow React frontend (running on port 5173 or others)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple storage for agent execution state
# In production, use a database (e.g., Redis or PostgreSQL)
runs = {}

class ResearchRequest(BaseModel):
    query: str

class ResearchResponse(BaseModel):
    id: str
    status: str
    report: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "AI Market Research Analyst API is running"}

@app.post("/research", response_model=ResearchResponse)
async def start_research(request: ResearchRequest):
    run_id = str(uuid.uuid4())
    # Initialize state
    state = {
        "query": request.query,
        "research_data": [],
        "verified_data": [],
        "report": "",
        "status": "Starting Research",
        "errors": []
    }
    
    # Run the graph synchronously for now (stateful agent execution)
    # Background execution with a task queue (like Celery) is better for production
    try:
        final_state = await graph.ainvoke(state)
        runs[run_id] = final_state
        return ResearchResponse(id=run_id, status=final_state["status"], report=final_state["report"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/research/{run_id}", response_model=ResearchResponse)
def get_research_status(run_id: str):
    if run_id not in runs:
        raise HTTPException(status_code=404, detail="Run not found")
    
    run = runs[run_id]
    return ResearchResponse(id=run_id, status=run["status"], report=run["report"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
