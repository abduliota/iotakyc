from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import kyc, gov, admin, auth

app = FastAPI(title="IOTA KYC Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(kyc.router,  prefix="/kyc",  tags=["KYC"])
app.include_router(gov.router,  prefix="/gov",  tags=["Government APIs"])
app.include_router(admin.router,prefix="/admin",tags=["Admin"])

@app.get("/ping")
def ping():
    return {"status": "alive", "service": "iotakyc-backend"}
