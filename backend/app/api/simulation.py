from fastapi import APIRouter
from app.schemas.schemas import SimulationInput
from app.services.simulation_service import run_simulation

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])


@router.post("")
def simulate(payload: SimulationInput):
    return run_simulation(payload.model_dump())
