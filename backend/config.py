import json
from typing import Union, List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')
    
    environment: str = 'development'
    supabase_url: str = 'http://localhost:54321'
    supabase_service_role_key: str = 'placeholder'
    api_prefix: str = '/api/v1'
    cors_origins: Union[list[str], str] = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    ]
    admin_nicknames: Union[list[str], str] = ['ADMIN', 'JUDGE', 'ROOT']
    
    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith('[') and v_stripped.endswith(']'):
                return json.loads(v_stripped)
            return [origin.strip() for origin in v_stripped.split(',') if origin.strip()]
        return v

    @field_validator('admin_nicknames', mode='before')
    @classmethod
    def parse_admin_nicknames(cls, v):
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith('[') and v_stripped.endswith(']'):
                return json.loads(v_stripped)
            return [name.strip() for name in v_stripped.split(',') if name.strip()]
        return v

settings = Settings()
