from pydantic import BaseModel
from typing import Optional

class CreateProjectRequest(BaseModel):
    name: str
    tagline: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    target_users: Optional[str] = None
    domain: Optional[str] = None
    features: Optional[str] = None
    tech_stack: Optional[str] = None
    mvp_plan: Optional[str] = None
    future_potential: Optional[str] = None
    image_url: Optional[str] = None

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    target_users: Optional[str] = None
    domain: Optional[str] = None
    features: Optional[str] = None
    tech_stack: Optional[str] = None
    mvp_plan: Optional[str] = None
    future_potential: Optional[str] = None
    image_url: Optional[str] = None
