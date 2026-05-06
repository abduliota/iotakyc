from pydantic import BaseModel
from typing import Optional, Any

class CreateSessionRequest(BaseModel):
    iqama: str
    user_id: Optional[str] = None

class SaveStepRequest(BaseModel):
    data: dict[str, Any]

class ActionRequest(BaseModel):
    action: str
    notes: Optional[str] = None
