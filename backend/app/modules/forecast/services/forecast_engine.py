"""
Forecast engine — pure function that projects future balances.

NO I/O, NO framework dependencies, NO database access.
Just math: transactions + overrides → projected daily balances.

This isolation is deliberate:
- Unit testable with fixed inputs/outputs, no mocks needed
- Swappable for a smarter model later without touching the API layer
- Reusable across request handlers and scheduled jobs

Algorithm (v1 — weekday rolling average):
    See LLD.md §2.1 for the full specification.
"""

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal


def generate_forecast(
    current_balance: Decimal,
    historical_transactions: list[dict],
    manual_overrides: list[dict] | None = None,
    horizon_days: int = 42,
) -> list[dict]:
    """
    Generate a cashflow forecast from transaction history.

    Args:
        current_balance: Today's bank balance.
        historical_transactions: Last ~90 days of transactions.
            Each dict must have 'date' (date or str) and 'amount' (number).
            Positive = inflow, negative = outflow.
        manual_overrides: Known future events to layer on top.
            Each dict must have 'date' (date or str) and 'amount' (number).
        horizon_days: How many days to project forward (default 42 = 6 weeks).

    Returns:
        List of dicts with 'date' (date) and 'projected_balance' (float),
        one per day from tomorrow through tomorrow + horizon_days.

    Algorithm:
        1. Group historical transactions by weekday (0=Monday..6=Sunday).
        2. For each weekday, compute the average daily net
           (mean of per-date totals).
        3. Walk forward from current_balance, adding the weekday average
           and any manual overrides for each day.
    """
    if manual_overrides is None:
        manual_overrides = []

    # ── Step 1: Build weekday averages ──
    weekday_averages = _compute_weekday_averages(historical_transactions)

    # ── Step 2: Index manual overrides by date ──
    override_map: dict[date, Decimal] = defaultdict(Decimal)
    for override in manual_overrides:
        d = _ensure_date(override["date"])
        override_map[d] += Decimal(str(override["amount"]))

    # ── Step 3: Project forward ──
    forecast = []
    balance = Decimal(str(current_balance))
    today = date.today()

    for day_offset in range(1, horizon_days + 1):
        forecast_date = today + timedelta(days=day_offset)
        weekday = forecast_date.weekday()

        # Add the average net for this weekday
        balance += weekday_averages[weekday]

        # Add any manual override for this specific date
        if forecast_date in override_map:
            balance += override_map[forecast_date]

        forecast.append({
            "date": forecast_date,
            "projected_balance": float(balance.quantize(Decimal("0.01"))),
        })

    return forecast


def detect_shortfall(
    forecast: list[dict],
    threshold: Decimal = Decimal("0"),
) -> dict | None:
    """
    Find the first day where the projected balance drops below threshold.

    Args:
        forecast: Output from generate_forecast().
        threshold: The balance floor (default 0 = any negative balance).

    Returns:
        Dict with 'date' and 'projected_balance' for the first shortfall,
        or None if the full horizon stays above threshold.
    """
    threshold_float = float(threshold)
    for day in forecast:
        if day["projected_balance"] < threshold_float:
            return {
                "date": day["date"],
                "projected_balance": day["projected_balance"],
            }
    return None


def _compute_weekday_averages(
    transactions: list[dict],
) -> dict[int, Decimal]:
    """
    Compute the average daily net amount for each weekday.

    Groups transactions by date, sums each date, then averages
    across all occurrences of each weekday.

    Returns:
        Dict mapping weekday (0-6) to average net Decimal.
        Missing weekdays default to 0.
    """
    # Group by date → sum amounts per date
    daily_totals: dict[date, Decimal] = defaultdict(Decimal)
    for txn in transactions:
        d = _ensure_date(txn["date"])
        daily_totals[d] += Decimal(str(txn["amount"]))

    # Group daily totals by weekday
    weekday_sums: dict[int, Decimal] = defaultdict(Decimal)
    weekday_counts: dict[int, int] = defaultdict(int)

    for d, total in daily_totals.items():
        wd = d.weekday()
        weekday_sums[wd] += total
        weekday_counts[wd] += 1

    # Compute averages
    averages: dict[int, Decimal] = {}
    for wd in range(7):
        if weekday_counts[wd] > 0:
            averages[wd] = weekday_sums[wd] / weekday_counts[wd]
        else:
            # A weekday with zero historical occurrences → avg_net = 0
            averages[wd] = Decimal("0")

    return averages


def _ensure_date(value) -> date:
    """Convert a string or date to a date object."""
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value))
