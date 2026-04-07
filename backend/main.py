from fastapi import Depends, FastAPI, Response, Request, Header, HTTPException, status
import os
import uuid
from dotenv import load_dotenv
from sqlmodel import Field, Session, SQLModel, create_engine, select, func, desc
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import func

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./checkins.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

ADDRESS = os.getenv("ADDRESS")
PEERLEADER_PASSWORD = os.getenv("PEERLEADER_PASSWORD")
IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"

PROGRAM_LABELS = {
    1: "Diploma",
    2: "Foundation Studies",
    3: "Academic English Program",
    4: "Pre-Masters",
}

HELP_TOPIC_LABELS = {
    "1": "Maths",
    "2": "Physics",
    "3": "Computing",
    "4": "Engineering",
    "5": "Commerce",
    "6": "Chemistry",
    "7": "Biology",
    "8": "Academic English",
}

class CheckIn(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    zid: str
    # name: str
    # program: int
    helps: str
    time: datetime
    signed: bool
    food: bool
    signature_token: str

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    zid: str
    name: str
    program: int
    total_signature: int
    current_signature: int
    total_attendance: int
    hoodies_collected: int

class Admin(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    name: str
    role: str
    expires_at: datetime

class Feedback(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    zid: str
    message: str
    message2: str
    message3: str
    time: datetime

engine = create_engine(DATABASE_URL)

SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          
        "http://127.0.0.1:5173",
        "https://unswcollegestudyclub.com",       
        "http://192.168.0.7:5173",
        "http://10.4.192.67:5173",
        "https://azure.jaesonliang.com",
        f"{ADDRESS}"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# helper function
def get_current_time():
    return datetime.now(ZoneInfo("Australia/Sydney")).replace(tzinfo=None)

def find_user_by_session(request: Request, session: Session):
    session_id = request.cookies.get("session_id")
    if not session_id:
        print("unautho")
        return None
    
    statement = select(User).where(User.session_id == session_id)
    return session.exec(statement).first()

def find_user_by_zid(zid: str, session: Session):
    if not zid:
        return None
    
    statement = select(User).where(User.zid == zid)
    return session.exec(statement).first()

def find_record_by_user(user:User, session: Session):
    curr_time = get_current_time()
    statement = (
        select(CheckIn)
        .where(
            CheckIn.zid == user.zid, 
            func.date(CheckIn.time) == curr_time.date()
        )
        .order_by(desc(CheckIn.time))
    )
    return session.exec(statement).first() 

def find_record_by_zid(zid:str, session: Session):
    if not zid:
        return None
    curr_time = get_current_time()
    statement = (
        select(CheckIn)
        .where(
            CheckIn.zid == zid, 
            func.date(CheckIn.time) == curr_time.date()
        )
        .order_by(desc(CheckIn.time))
    )
    return session.exec(statement).first() 


def validate_admin_session(request: Request, session: Session, role: str):
    admin_session_id = request.cookies.get("admin_session_id")
    if not admin_session_id:
        raise HTTPException(status_code=401, detail="Unauthorized: Admin access required")

    leader_statement = select(Admin).where(Admin.session_id == admin_session_id)
    leader = session.exec(leader_statement).first()
    if not leader:
        raise HTTPException(status_code=401, detail="Unauthorized: Admin access invalid")

    curr_time = get_current_time()
    if curr_time > leader.expires_at:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    
    if leader.role != role:
        raise HTTPException(status_code=403, detail="Unauthorized: Insufficient permissions")

    return leader


@app.post("/checkin")
async def checkin(data: dict, response: Response ,session: Session = Depends(get_session)):
    # curr_time
    curr_time = get_current_time()

    raw_helps = data.get('helps', [])
    if isinstance(raw_helps, list):
        helps_string = ",".join(str(item) for item in raw_helps)
    else:
        helps_string = str(raw_helps)


    raw_zid = data['zid']
    # check if the user already checkin for today
    row = find_record_by_zid(raw_zid, session)
    if row and ((curr_time.hour < 17 and row.time.hour < 17) or (curr_time.hour >= 17 and row.time.hour >= 17)):
        print(f"Failed: {raw_zid} has the record today at this session time")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="You have already checked in for this session today."
        )

    # if the student zid is already recorded
    new_session_id = str(uuid.uuid4())
    statement = select(User).where(User.zid == raw_zid)
    record = session.exec(statement).first()
    if record:
        print(f"have record for {record.zid}")

        record.session_id = new_session_id
        record.name = data['name']
        record.program = data.get('program', '')
        record.total_attendance += 1

        session.add(record)

    else:
        # generate new session id
        user_session = User(
            session_id=new_session_id, 
            zid=data['zid'], 
            name=data['name'],
            program=data.get('program', ''),
            total_signature=0,
            current_signature=0,
            total_attendance=1,
            hoodies_collected=0
        )
        session.add(user_session)

    # Create a new row in the database
    new_checkin = CheckIn(
        zid=data['zid'],
        # name=data['name'],
        # program=data.get('program', ''), # .get() prevents crashes if missing
        helps=helps_string,
        time=curr_time,
        signed=False,
        food=False,
        signature_token=uuid.uuid4().hex[:8]
    )
    session.add(new_checkin)

    session.commit()
    # session.refresh(new_checkin)

    response.set_cookie(
        key="session_id",
        value=new_session_id,
        max_age=60*60*24*365,
        httponly=True,
        samesite='lax',
        secure=IS_PRODUCTION,
    )


    print(f"Success: {new_checkin.zid} saved to DB with ID {new_checkin.id} with sessionid {new_session_id}")
    return {"status": "success"}


@app.post("/existcheckin")
async def existcheckin(data: dict, response: Response ,session: Session = Depends(get_session)):
    curr_time = get_current_time()

    raw_helps = data.get('helps', [])
    if isinstance(raw_helps, list):
        helps_string = ",".join(str(item) for item in raw_helps)
    else:
        helps_string = str(raw_helps)


    raw_zid = data['zid']

    # check if the user already checkin for today
    row = find_record_by_zid(raw_zid, session)
    if row and ((curr_time.hour < 17 and row.time.hour < 17) or (curr_time.hour >= 17 and row.time.hour >= 17)):
        print(f"Failed: {raw_zid} has the record today at this session time")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="You have already checked in for this session today."
        )

    # if the student zid is already recorded
    new_session_id = None
    user = find_user_by_zid(raw_zid, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="invalid session id, try clear cookies and try again!"
        )
    
    user.total_attendance+= 1

    session.add(user)

    # Create a new row in the database
    new_checkin = CheckIn(
        zid=data['zid'],
        helps=helps_string,
        time=curr_time,
        signed=False,
        food=False,
        signature_token=uuid.uuid4().hex[:8]
    )
    session.add(new_checkin)

    session.commit()
    # session.refresh(new_checkin)

    if new_session_id:
        response.set_cookie(
            key="session_id",
            value=new_session_id,
            max_age=60*60*24*365,
            httponly=True,
            samesite='lax',
            secure=IS_PRODUCTION,
        )

    print(f"Success: {new_checkin.zid} saved to DB with ID {new_checkin.id} with sessionid {new_session_id}")
    return {"status": "success"}



@app.get("/whoami")
async def get_user(request: Request, session: Session = Depends(get_session)):
    # Check if the cookie exists
    user = find_user_by_session(request, session)
    if not user:
        return {"recorded": False}
    
    curr_time = get_current_time()
    row = find_record_by_user(user, session)

    checkined = False
    if row and ((curr_time.hour < 17 and row.time.hour < 17) or (curr_time.hour >= 17 and row.time.hour >= 17)):
        checkined = True

    return {
        "recorded": True,
        "checkined": checkined,
        "zid": user.zid,
        "name": user.name,
        "program": user.program,
        "current_signature:": user.current_signature
    }



@app.get("/qrcode")
async def get_qrcode(request: Request,  session: Session = Depends(get_session)):
    # user zid
    user = find_user_by_session(request, session)
    if not user:
        return {"error": "User not found"}
    
    row = find_record_by_user(user, session)
    if row is None:
        return {"error": "Time not found"}
    
    curr_time = get_current_time()
    
    target_time = row.time + timedelta(minutes=30)
    time_left = target_time - curr_time
    seconds_left = int(time_left.total_seconds())

    if seconds_left <= 0:
        date_str = curr_time.strftime("%Y%m%d")
        random_str = row.signature_token
        scan_url = f"{ADDRESS}/admin/stamp/{user.zid}{date_str}{random_str}"
        
        return {
            "is_time": True,
            "qrcode": scan_url
        }

    return {
        "is_time": False,
        "rest_time": seconds_left
    }

@app.post("/admin/scan/{qr_code}")
async def scan_qrcode(
    qr_code: str, 
    request: Request, 
    session: Session = Depends(get_session),
    # Require an admin password to be sent in the request headers
    # x_admin_token: str = Header(None) 
):
    # authorizing
    admin_session_id = request.cookies.get("admin_session_id")
    if not admin_session_id:
        print("401 no admin token")
        raise HTTPException(status_code=401, detail="Unauthorized: Admin access required")
    
    leader_statement = select(Admin).where(Admin.session_id == admin_session_id)
    leader = session.exec(leader_statement).first()

    if not leader:
        print("401 Admin access invalid")
        raise HTTPException(status_code=401, detail="Unauthorized: Admin access invalid")
    
    curr_time = get_current_time()
    
    if curr_time > leader.expires_at:
        print("401 Session expired")
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

    #qrcode checking
    if len(qr_code) < 16:
        return {"status": "error", "message": "Invalid QR code format"}
    
    signature_token = qr_code[-8:]
    statement = select(CheckIn).where(CheckIn.signature_token == signature_token)
    row = session.exec(statement).first()
    if not row:
        return {"status": "error", "message": "No check-in found for today"}
    
    if row.signed:
        return {"status": "error", "message": "Already checked in for today"}

    row.signed = True
    session.add(row)


    zid = qr_code[:8]
    user_statement = select(User).where(User.zid == zid)
    target_user = session.exec(user_statement).first()
    if not target_user:
        return {"status": "error", "message": "User account not found"}
    
    target_user.total_signature += 1
    target_user.current_signature += 1
    session.add(target_user)

    session.commit()

    return {
        "status": "success",
        "message": f"Successfully stamped! {target_user.name} now has {target_user.current_signature} signatures."
    }

@app.post("/admin/login")
async def admin_login(data: dict, response: Response, session: Session = Depends(get_session)):
    if data.get("password") != PEERLEADER_PASSWORD:
        print(data.get("password"))
        print(PEERLEADER_PASSWORD)
        raise HTTPException(status_code=401, detail="Invalid admin password")
        
    leader_session_id = str(uuid.uuid4())

    curr_time = get_current_time()
    
    expiration_time = curr_time + timedelta(seconds=60 * 60 * 24 * 200)
    
    new_leader = Admin(
        session_id=leader_session_id,
        name=data.get("name", "Unknown Leader"),
        role= "Peer Leader",
        expires_at=expiration_time
    )
    session.add(new_leader)
    session.commit()
    
    response.set_cookie(
        key="admin_session_id",
        value=leader_session_id,
        # max_age=120,
        max_age=60 * 60 * 24 * 200, # 200 days
        httponly=True,
        samesite='lax',
        secure=IS_PRODUCTION,
    )
    
    return {"status": "success", "name": new_leader.name}


@app.get("/admin/analytics")
async def admin_analytics(request: Request, session: Session = Depends(get_session)):
    validate_admin_session(request, session, "Peer Leader")

    users = session.exec(select(User)).all()
    checkins = session.exec(select(CheckIn)).all()

    program_by_zid = {user.zid: PROGRAM_LABELS.get(user.program, "Unknown") for user in users}

    attendance_by_program: dict[str, int] = {}
    attendance_by_month: dict[str, int] = {}
    help_topic_counts: dict[str, int] = {}

    for checkin in checkins:
        month_key = checkin.time.strftime("%Y-%m")
        attendance_by_month[month_key] = attendance_by_month.get(month_key, 0) + 1

        program_name = program_by_zid.get(checkin.zid, "Unknown")
        attendance_by_program[program_name] = attendance_by_program.get(program_name, 0) + 1

        helps_value = (checkin.helps or "").strip()
        if not helps_value:
            help_topic_counts["No specific"] = help_topic_counts.get("No specific", 0) + 1
        else:
            topic_ids = [part.strip() for part in helps_value.split(",") if part.strip()]
            if not topic_ids:
                help_topic_counts["No specific"] = help_topic_counts.get("No specific", 0) + 1
            for topic_id in topic_ids:
                topic_name = HELP_TOPIC_LABELS.get(topic_id, "Other")
                help_topic_counts[topic_name] = help_topic_counts.get(topic_name, 0) + 1

    frequency_once = 0
    frequency_two_to_five = 0
    frequency_more_than_five = 0
    afternoon_checkins = 0
    noon_checkins = 0
    blockhouse_checkins = 0
    l5_checkins = 0

    for checkin in checkins:
        checkin_hour = checkin.time.hour
        checkin_weekday = checkin.time.weekday()

        if 14 <= checkin_hour < 17:
            afternoon_checkins += 1
        elif 17 <= checkin_hour < 20:
            noon_checkins += 1

        if checkin_weekday in (0, 3) and 14 <= checkin_hour < 17:
            blockhouse_checkins += 1

        is_l5_evening = checkin_weekday in (0, 2, 3) and 17 <= checkin_hour < 20
        is_l5_tuesday = checkin_weekday == 1 and 14 <= checkin_hour < 20
        if is_l5_evening or is_l5_tuesday:
            l5_checkins += 1

    for user in users:
        total_attendance = user.total_attendance or 0
        if total_attendance <= 1:
            frequency_once += 1
        elif total_attendance <= 5:
            frequency_two_to_five += 1
        else:
            frequency_more_than_five += 1

    sorted_months = sorted(attendance_by_month.items())
    last_twelve_months = sorted_months[-12:]
    attendance_by_month_result = [
        {"month": month, "count": count}
        for month, count in last_twelve_months
    ]

    attendance_by_program_result = [
        {"name": name, "count": count}
        for name, count in sorted(attendance_by_program.items(), key=lambda item: item[1], reverse=True)
    ]

    help_topics_result = [
        {"name": name, "count": count}
        for name, count in sorted(help_topic_counts.items(), key=lambda item: item[1], reverse=True)
    ]

    top_attendees_result = [
        {
            "zid": user.zid,
            "name": user.name,
            "sessions": user.total_attendance,
        }
        for user in sorted(users, key=lambda item: item.total_attendance, reverse=True)[:15]
    ]

    total_checkins = len(checkins)
    total_students = len(users)
    total_signed = sum(1 for checkin in checkins if checkin.signed)
    total_food_collected = sum(1 for checkin in checkins if checkin.food)
    total_hoodies_collected = sum(user.hoodies_collected for user in users)

    return {
        "summary": {
            "total_checkins": total_checkins,
            "total_students": total_students,
            "total_signed": total_signed,
            "total_food_collected": total_food_collected,
            "total_hoodies_collected": total_hoodies_collected,
            "average_attendance_per_student": round(total_checkins / total_students, 2) if total_students > 0 else 0,
        },
        "attendance_by_month": attendance_by_month_result,
        "attendance_by_program": attendance_by_program_result,
        "attendance_frequency": [
            {"name": "Once", "count": frequency_once},
            {"name": "2-5 times", "count": frequency_two_to_five},
            {"name": "More than 5 times", "count": frequency_more_than_five},
        ],
        "session_checkins": [
            {"name": "Afternoon (2-5pm)", "count": afternoon_checkins},
            {"name": "Evening (5-8pm)", "count": noon_checkins},
        ],
        "venue_checkins": [
            {"name": "Blockhouse", "count": blockhouse_checkins},
            {"name": "L5", "count": l5_checkins},
        ],
        "top_attendees": top_attendees_result,
        "help_topics": help_topics_result,
    }


@app.patch("/checkin/food")
async def collect_food(request: Request, session: Session = Depends(get_session)):
    user = find_user_by_session(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    row = find_record_by_user(user, session)
    if not row:
        raise HTTPException(status_code=404, detail="No check-in found for today")

    row.food = True
    session.add(row)
    session.commit()

    return {"status": "success", "message": "Food collected"}


@app.get("/status/food")
async def food_status(request: Request, session: Session = Depends(get_session)):
    user = find_user_by_session(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    row = find_record_by_user(user, session)
    if not row:
        raise HTTPException(status_code=404, detail="No check-in found for today")

    return {"food": row.food}

@app.get("/status/stamps")
async def stamps_status(request: Request, session: Session = Depends(get_session)):
    user = find_user_by_session(request, session)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if user.current_signature >= 20:
        row = find_record_by_user(user, session)
        if not row:
            return {"error": "user should at least have one record"}

        scan_url = f"{ADDRESS}/admin/redeem/{user.zid}{row.signature_token}"
        return {"finished": True, "count": user.current_signature, "qrcode": scan_url}
    else:
        return {"finished": False, "count": user.current_signature}

@app.post("/admin/redeem/{qr_code}")
async def admin_redeemscan_qrcode(
    qr_code: str, 
    request: Request, 
    session: Session = Depends(get_session),
):
    # authorizing
    admin_session_id = request.cookies.get("admin_session_id")
    if not admin_session_id:
        raise HTTPException(status_code=401, detail="Unauthorized: Admin access required")
    
    leader_statement = select(Admin).where(Admin.session_id == admin_session_id)
    leader = session.exec(leader_statement).first()

    if not leader:
        raise HTTPException(status_code=401, detail="Unauthorized: Admin access required")
    
    curr_time = get_current_time()
    
    if curr_time > leader.expires_at:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

    #redeem
    if len(qr_code) < 16:
        return {"status": "error", "message": "Invalid QR code format"}
    
    signature_token = qr_code[-8:]
    statement = select(CheckIn).where(CheckIn.signature_token == signature_token)
    row = session.exec(statement).first()
    if not row:
        return {"status": "error", "message": "unautho request"}


    zid = qr_code[:8]
    user_statement = select(User).where(User.zid == zid)
    target_user = session.exec(user_statement).first()
    if not target_user:
        return {"status": "error", "message": "User account not found"}
    
    if target_user.current_signature < 20:
        return {"status": "error", "message": f"Not enough stamps, {target_user.name} now has {target_user.current_signature} signatures"}
    
    target_user.current_signature -= 20
    target_user.hoodies_collected += 1
    session.add(target_user)
    session.commit()

    return {
        "status": "success",
        "message": f"Successfully redeemed! {target_user.name} now has {target_user.current_signature} signatures."
    }