from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random
import time
from datetime import datetime

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models (Matching Frontend Interfaces) ---

class Hazard(BaseModel):
    id: str
    lat: float
    lng: float
    type: str
    title: str
    severity: str  # 'Critical' | 'Warning' | 'Advisory'
    source: str = 'AI'
    description: Optional[str] = None
    confidence: Optional[float] = None
    imageUrl: Optional[str] = None
    # Predictive Features
    isPredictive: bool = False
    predictionTime: Optional[str] = None
    probability: Optional[float] = None

# --- Simulation Logic ---

def generate_deterministic_hazards(lat: float, lng: float) -> List[Hazard]:
    """
    Simulates AI analysis based on coordinates. 
    Uses hashing to ensure the same location produces consistent 'random' results for demo stability.
    """
    hazards = []
    
    # Create a seed from coordinates to make results deterministic per location
    seed = int((abs(lat) + abs(lng)) * 10000)
    random.seed(seed)
    
    current_hour = datetime.now().hour

    # 1. AI Traffic Analysis
    if random.random() > 0.3:
        hazards.append(Hazard(
            id=f"ai_traffic_{seed}",
            lat=lat + (random.uniform(-0.005, 0.005)),
            lng=lng + (random.uniform(-0.005, 0.005)),
            type="Traffic",
            title="High Volume Congestion",
            severity="Warning",
            source="AI",
            description=f"Traffic flow density at {random.randint(80, 98)}%. Average speed < 15km/h.",
            confidence=round(random.uniform(0.85, 0.99), 2)
        ))

    # 2. Predictive Analysis (Future Events)
    if random.random() > 0.5:
        prob = round(random.uniform(0.70, 0.95), 2)
        hazards.append(Hazard(
            id=f"ai_pred_{seed}",
            lat=lat + (random.uniform(-0.005, 0.005)),
            lng=lng + (random.uniform(-0.005, 0.005)),
            type="Predictive",
            title="Urban Flood Risk",
            severity="Critical" if prob > 0.85 else "Warning",
            source="AI",
            description="Topographical analysis suggests high water accumulation risk in next rainfall.",
            confidence=prob,
            isPredictive=True,
            predictionTime=f"in {random.randint(1, 4)} hours",
            probability=prob
        ))

    # 3. Environmental / Visiblity
    if current_hour > 18 or current_hour < 6 or random.random() > 0.7:
        hazards.append(Hazard(
            id=f"ai_vis_{seed}",
            lat=lat + (random.uniform(-0.005, 0.005)),
            lng=lng + (random.uniform(-0.005, 0.005)),
            type="Weather",
            title="Low Visibility Zone",
            severity="Advisory",
            source="AI",
            description="Fog/Smog density analysis indicates visibility below 50m.",
            confidence=round(random.uniform(0.80, 0.95), 2)
        ))

    return hazards

# --- Endpoints ---

@app.get("/api/status")
def read_root():
    return {"status": "SatarkX AI Neural Engine Online"}

# Route for /ai/scan. Vercel passes the full path, so we can capture it here.
@app.get("/ai/scan", response_model=List[Hazard])
def scan_area(lat: float, lng: float):
    """
    Simulates a real-time AI scan of the area provided by lat/lng.
    Returns detected hazards and predictive models.
    """
    # Simulate processing delay for realism
    time.sleep(0.5) 
    
    results = generate_deterministic_hazards(lat, lng)
    return results
