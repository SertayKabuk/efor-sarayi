from typing import Any, Iterable


def calculate_implementation_plan_effort(phases: Iterable[Any] | None) -> float:
    total = 0.0

    for phase in phases or []:
        if isinstance(phase, dict):
            raw_effort = phase.get("effort_days", 0)
        else:
            raw_effort = getattr(phase, "effort_days", 0)

        try:
            effort = float(raw_effort)
        except (TypeError, ValueError):
            continue

        total += max(effort, 0)

    return total