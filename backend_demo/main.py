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
            total_attendance=1
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
    session.add(target_user)
    session.commit()

    return {
        "status": "success",
        "message": f"Successfully redeemed! {target_user.name} now has {target_user.current_signature} signatures."
    }