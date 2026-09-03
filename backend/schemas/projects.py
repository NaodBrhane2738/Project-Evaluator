from pydantic import BaseModel, field_validator
from typing import Optional

def validate_url(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    s = v.strip()
    if not s:
        return None
    if len(s) > 2048:
        raise ValueError('URL cannot exceed 2048 characters')
    if not (s.startswith('http://') or s.startswith('https://')):
        raise ValueError('Image URL must start with http:// or https://')
    return s

def validate_text(v: Optional[str], max_len: int = 10000) -> Optional[str]:
    if v is None:
        return None
    s = v.strip()
    if len(s) > max_len:
        raise ValueError(f'Field content exceeds maximum allowed length of {max_len} characters')
    return s

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

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 1 or len(s) > 200:
            raise ValueError('Project name must be between 1 and 200 characters')
        return s

    @field_validator('tagline')
    @classmethod
    def validate_tagline(cls, v: Optional[str]) -> Optional[str]:
        return validate_text(v, 300)

    @field_validator('domain')
    @classmethod
    def validate_domain(cls, v: Optional[str]) -> Optional[str]:
        return validate_text(v, 100)

    @field_validator('problem', 'solution', 'target_users', 'features', 'tech_stack', 'mvp_plan', 'future_potential')
    @classmethod
    def validate_descriptions(cls, v: Optional[str]) -> Optional[str]:
        return validate_text(v, 10000)

    @field_validator('image_url')
    @classmethod
    def validate_image_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_url(v)

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

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        s = v.strip()
        if len(s) < 1 or len(s) > 200:
            raise ValueError('Project name must be between 1 and 200 characters')
        return s

    @field_validator('tagline')
    @classmethod
    def validate_tagline(cls, v: Optional[str]) -> Optional[str]:
        return validate_text(v, 300)

    @field_validator('domain')
    @classmethod
    def validate_domain(cls, v: Optional[str]) -> Optional[str]:
        return validate_text(v, 100)

    @field_validator('problem', 'solution', 'target_users', 'features', 'tech_stack', 'mvp_plan', 'future_potential')
    @classmethod
    def validate_descriptions(cls, v: Optional[str]) -> Optional[str]:
        return validate_text(v, 10000)

    @field_validator('image_url')
    @classmethod
    def validate_image_url(cls, v: Optional[str]) -> Optional[str]:
        return validate_url(v)
