from pydantic import BaseModel, field_validator
from typing import Optional
import re

SYSTEM_RESERVED = {'null', 'undefined', 'anonymous', 'system', 'bot', 'api'}

class ClaimNicknameRequest(BaseModel):
    nickname: str
    password: Optional[str] = None
    
    @field_validator('nickname')
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 20:
            raise ValueError('Nickname must be 3–20 characters')
        if not re.match(r'^[A-Za-z0-9_-]+$', v):
            raise ValueError('Nickname may only contain letters, numbers, _ and -')
        if v.lower() in SYSTEM_RESERVED:
            raise ValueError('That nickname is reserved for system use')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_stripped = v.strip()
            if len(v_stripped) > 128:
                raise ValueError('Password cannot exceed 128 characters')
            return v_stripped if v_stripped else None
        return v

class CheckNicknameRequest(BaseModel):
    nickname: str

    @field_validator('nickname')
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1 or len(v) > 50:
            raise ValueError('Nickname must be between 1 and 50 characters')
        return v

class CheckNicknameResponse(BaseModel):
    exists: bool
    has_password: bool
    nickname: str

class UserResponse(BaseModel):
    id: str
    nickname: str
    created_at: str
    last_active_at: str
