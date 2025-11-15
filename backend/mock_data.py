"""Static mock data used for /analyze endpoint.
The function build_mock_analysis can perform light heuristics on input code.
"""
from typing import Dict
from models import StepAnalysis

CANDIDATE_VARS = ["arr", "xs", "x", "lst", "values"]


def infer_var(code: str) -> str:
    for token in CANDIDATE_VARS:
        if f"len({token})+1" in code:
            return token
    return "xs"


def build_mock_analysis(code: str) -> Dict[str, StepAnalysis]:
    var = infer_var(code)
    rule = StepAnalysis(
        icon="⚙️",
        title="Hệ thống",
        reasoning_steps=[
            "Đọc cấu trúc vòng lặp để kiểm tra biên.",
            f"Phát hiện range(len({var})+1) có thể vượt chỉ số.",
            "Giới hạn hợp lệ là 0..len(xs)-1.",
        ],
        fix_steps=[
            f"Đổi range(len({var})+1) → range(len({var})).",
            "Kiểm thử lại với biên nhỏ ([], [1]).",
        ],
        suggested_patch=f"for i in range(len({var})):",
    )
    llm = StepAnalysis(
        icon="🤖",
        title="LLM",
        reasoning_steps=[
            "Xác thực logic so sánh và truy cập phần tử.",
            f"Chỉ số len({var}) sẽ gây IndexError.",
            "Cần lặp tới len(xs)-1 hoặc duyệt trực tiếp giá trị.",
        ],
        fix_steps=[
            f"Thay bằng range(len({var})).",
            "Hoặc dùng for v in xs: if v > m: m = v.",
        ],
        suggested_patch=f"for i in range(len({var})):",
    )
    return {"rule": rule, "llm": llm}
