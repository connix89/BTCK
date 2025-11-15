from pydantic import BaseModel
from typing import List, Optional

class StepAnalysis(BaseModel):
    icon: str
    title: str
    reasoning_steps: List[str]
    fix_steps: List[str]
    suggested_patch: Optional[str] = None
    highlightLines: Optional[List[int]] = None  # optional line highlight indices
