"""Create a local SQLite database full of fake check-ins for trying the admin dashboard.

    uv run python seed_dev_db.py            # writes ./dev.db (gitignored)
    DATABASE_URL=sqlite:///./dev.db ENVIRONMENT=development uv run uvicorn main:app --port 8000 --reload

Every admin login against this database is given the "Admin" role by a trigger that only
lives inside dev.db, so you can log in at /admin/login with the usual password and open
/admin/dashboard. Nothing here touches checkins.db or the database in .env.
"""
import random
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

MARKER_TABLE = "dev_seed_marker"

FIRST_NAMES = ["Alex", "Sam", "Jordan", "Taylor", "Casey", "Riley", "Jamie", "Morgan", "Avery", "Quinn", "Kai",
               "Rowan", "Mina", "Leo", "Yuki", "Arjun", "Chen", "Priya", "Omar", "Lena", "Hugo", "Ivy", "Noah", "Zara"]
LAST_NAMES = ["Nguyen", "Smith", "Wang", "Patel", "Kim", "Lee", "Garcia", "Brown", "Chen", "Singh", "Ali", "Tran",
              "Park", "Wilson", "Lopez", "Khan"]
HELPFUL = ["The maths tutor explained limits really clearly.", "Quiet space and friendly peer leaders.",
           "Getting help with my physics lab report.", "Free food!", "Working through past papers together.",
           "Help with Python debugging."]
BETTER = ["More seats on Tuesday evenings.", "Longer sessions near exams.", "More chemistry tutors.",
          "Hard to find the room the first time.", ""]
OTHER = ["Thanks team!", "", "", "Keep it up.", ""]
# busier around census and exam months, quiet over the summer break
MONTH_WEIGHT = {1: 0.3, 2: 0.9, 3: 1.4, 4: 1.1, 5: 1.3, 6: 0.8, 7: 0.6, 8: 1.3, 9: 1.4, 10: 1.2, 11: 1.0, 12: 0.4}

SCHEMA = f"""
CREATE TABLE {MARKER_TABLE} (created_at DATETIME NOT NULL);
CREATE TABLE checkin (id INTEGER PRIMARY KEY, zid VARCHAR NOT NULL, helps VARCHAR NOT NULL, time DATETIME NOT NULL,
    signed BOOLEAN NOT NULL, food BOOLEAN NOT NULL, signature_token VARCHAR NOT NULL);
CREATE TABLE user (id INTEGER PRIMARY KEY, session_id VARCHAR NOT NULL, zid VARCHAR NOT NULL, name VARCHAR NOT NULL,
    program INTEGER NOT NULL, total_signature INTEGER NOT NULL, current_signature INTEGER NOT NULL,
    total_attendance INTEGER NOT NULL, hoodies_collected INTEGER NOT NULL);
CREATE INDEX ix_user_session_id ON user (session_id);
CREATE TABLE admin (id INTEGER PRIMARY KEY, session_id VARCHAR NOT NULL, name VARCHAR NOT NULL, role VARCHAR NOT NULL,
    expires_at DATETIME NOT NULL);
CREATE INDEX ix_admin_session_id ON admin (session_id);
CREATE TABLE feedback (id INTEGER PRIMARY KEY, zid VARCHAR NOT NULL, rating INTEGER NOT NULL, message VARCHAR,
    message2 VARCHAR, message3 VARCHAR, time DATETIME NOT NULL);

-- local only: /admin/login creates "Peer Leader" sessions, the dashboard needs "Admin"
CREATE TRIGGER local_logins_are_admins AFTER INSERT ON admin
BEGIN
    UPDATE admin SET role = 'Admin' WHERE id = NEW.id;
END;
"""


def open_target(path: Path) -> sqlite3.Connection:
    if path.name == "checkins.db":
        sys.exit("Refusing to overwrite checkins.db. Pass another file name, e.g. dev.db.")

    if path.exists():
        connection = sqlite3.connect(path)
        has_marker = connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?", (MARKER_TABLE,)
        ).fetchone()
        connection.close()
        if not has_marker:
            sys.exit(f"{path} was not made by this script, so it is left alone.")
        path.unlink()

    return sqlite3.connect(path)


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "dev.db")
    random.seed(7)
    connection = open_target(path)
    cursor = connection.cursor()
    cursor.executescript(SCHEMA)
    cursor.execute(f"INSERT INTO {MARKER_TABLE} VALUES (?)", (datetime.now().isoformat(sep=" "),))

    users = []
    for _ in range(260):
        zid = f"z5{random.randint(100000, 999999)}"
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        program = random.choices([1, 2, 3, 4, 5], weights=[38, 30, 12, 12, 8])[0]
        loyalty = random.choices([1, 3, 9], weights=[45, 40, 15])[0]
        users.append((zid, name, program, loyalty))

    # twelve months of Mon-Thu sessions ending right now
    end = datetime.now().replace(microsecond=0)
    start = (end.replace(day=1) - timedelta(days=330)).replace(day=1, hour=0, minute=0, second=0)
    checkins = []
    day = start
    while day <= end:
        if day.weekday() <= 3:
            count = int(random.gauss(14, 4) * MONTH_WEIGHT[day.month])
            for _ in range(max(count, 0)):
                user = random.choices(users, weights=[u[3] for u in users])[0]
                hour = random.choices([14, 15, 16, 17, 18, 19], weights=[14, 18, 12, 20, 16, 8])[0]
                time = day.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
                if time > end:
                    continue
                topics = random.sample([str(topic) for topic in range(1, 10)], random.choices([0, 1, 2], weights=[10, 70, 20])[0])
                helps = ",".join(sorted(topics, key=int))
                checkins.append((user[0], helps, time.isoformat(sep=" "), random.random() < 0.62, random.random() < 0.48, "dev"))
        day += timedelta(days=1)

    cursor.executemany(
        "INSERT INTO checkin (zid, helps, time, signed, food, signature_token) VALUES (?, ?, ?, ?, ?, ?)", checkins
    )

    attendance = {}
    for row in checkins:
        attendance[row[0]] = attendance.get(row[0], 0) + 1
    for zid, name, program, _ in users:
        visits = attendance.get(zid, 0)
        hoodies = 1 if visits >= 8 and random.random() < 0.7 else 0
        cursor.execute(
            "INSERT INTO user (session_id, zid, name, program, total_signature, current_signature, total_attendance, hoodies_collected)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (f"dev-{zid}", zid, name, program, visits, visits % 8, visits, hoodies),
        )

    feedback = []
    for row in random.sample(checkins, min(210, len(checkins))):
        rating = random.choices([1, 2, 3, 4, 5], weights=[3, 4, 12, 35, 46])[0]
        wrote = random.random() < 0.55
        feedback.append((
            row[0],
            rating,
            random.choice(HELPFUL) if wrote else None,
            random.choice(BETTER) if wrote else None,
            random.choice(OTHER) if wrote else None,
            row[2],
        ))
    cursor.executemany(
        "INSERT INTO feedback (zid, rating, message, message2, message3, time) VALUES (?, ?, ?, ?, ?, ?)", feedback
    )

    connection.commit()
    connection.close()
    print(f"Wrote {path}: {len(checkins)} check-ins, {len(users)} students, {len(feedback)} feedback responses.")


if __name__ == "__main__":
    main()
