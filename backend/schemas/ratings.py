from pydantic import BaseModel, field_validator

class SubmitRatingRequest(BaseModel):
    demo: int
    time: int
    technical_depth: int
    influence: int
    authenticity: int
    simplicity: int
    market: int
    scalability: int
    
    @field_validator('demo','time','technical_depth','influence','authenticity','simplicity','market','scalability', mode='before')
    @classmethod
    def validate_score(cls, v) -> int:
        v = int(v)
        if not (0 <= v <= 100):
            raise ValueError('Each score must be between 0 and 100')
        return v
