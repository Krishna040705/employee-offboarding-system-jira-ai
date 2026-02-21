from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Ticket(BaseModel):
    text: str

@app.get("/")
def root():
    return {"message": "Jira Auto Activation/Deactivation API is running"}

@app.post("/process")
def process_ticket(ticket: Ticket):
    text = ticket.text.lower()

    activate_keywords = ["activate", "enable", "create", "add user"]
    deactivate_keywords = ["deactivate", "disable", "remove", "delete user", "block"]

    action = "unknown"

    for word in activate_keywords:
        if word in text:
            action = "activate"
            break

    for word in deactivate_keywords:
        if word in text:
            action = "deactivate"
            break

    return {
        "input_text": ticket.text,
        "action": action,
        "status": "processed"
    }