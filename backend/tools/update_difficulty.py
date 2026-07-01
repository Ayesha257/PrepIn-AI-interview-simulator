def update_difficulty(session_id: str, score: float) -> str:
    if score < 4.0:
        return "easy"
    elif score <= 7.0:
        return "medium"
    else:
        return "hard"