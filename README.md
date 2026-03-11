
![Logo](.frontend/public/studyClub.svg)

## ucLCMS

LCMS, stands for Loyalty Check-in Management System, is an integrated student utility platform designed specifically for the UNSW College ecosystem. It simplifies student daily life by consolidating study club services into a single, user-friendly interface.

### Demo 

![App Screenshot](/frontend/public/visitor_number.png)

We just handled over 100 users' checkin in the first 24 hours of deployment, with anti-bot feature enabled!

---
\
[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](https://unswcollegestudyclub.com/demo)

Here is a simple demo of student interface:
![Student Demo](/frontend/public/student_demo.png)
### Features 

* Digital attendance and location-based check-ins for study club.
* "Grab Food" Integration: A clean streamlined system for students to claim food during the session.
* "Opal Study": Integrated monitoring for study sessions, helping students track their academic engagement and loyalty rewards.
* Pretty css feels like drinking smoothy (I just learned how to make banana milk smoothy🍌🥤)

### System Architecture 

* Frontend: Built with React and Vite for a fast, responsive mobile-first student experience

* Backend: Powered by Python (FastAPI), handling student authentication, loyalty logic, and database management.

* Database: With PostgreSQL, it is structured to manage student profiles, check-in history, and reward balances. And it is able to output the ayalised data for boss to visualized it.
## Setup

**Prequest**
- uv
- npm

**Backend setup:**

1. Navigate to the backend/ directory.

2. Create a file named .env:
```bash
  touch .env
```

3. Copy and paste the following template into your .env file:
```copy
# Database configuration
DATABASE_URL=sqlite:///./checkins.db

# Frontend Address (Update this based on your current network IP)
# You can check with Mac: option key+click wifi icon -> IP Address
# Change the default port number if needed
ADDRESS=http://192.168.0.7:5173

# Password
PEERLEADER_PASSWORD="plSecretPassword2kY7p6"

# App State
ENVIRONMENT="coding"
```

4. Running the Server
```bash
  uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```


**Frontend Setup**

1. Navigate to the frontend/ directory.

2. Create a file named .env:
```bash
  touch .env
```

3. Copy and paste the following template into your .env file:
```copy
# Backend Address (Update this based on your current network IP)
# You can check with Mac: option key+click wifi icon -> IP Address
# Change the default port number if needed
VITE_ADDRESS=http://192.168.0.7:8000
```
4. Running the Server
```bash
  npm run dev -- --host 0.0.0.0
```

---
\
Then you should be able to go to the address in your frontend address you previously setup in .env file to accessing the web app running in local machine. The best part is, if your phone is also connected to your local network, then you can directly access it with same ip address to test it on phone!!

Also, if you perfer to use chrome->inspect, the best viewpoint for "Toggle device toolbar" is 367*687 as for samsung s24.
