from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Maps appointment_id -> list of active WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, appointment_id: int):
        await websocket.accept()
        if appointment_id not in self.active_connections:
            self.active_connections[appointment_id] = []
        self.active_connections[appointment_id].append(websocket)

    def disconnect(self, websocket: WebSocket, appointment_id: int):
        if appointment_id in self.active_connections:
            if websocket in self.active_connections[appointment_id]:
                self.active_connections[appointment_id].remove(websocket)
            if len(self.active_connections[appointment_id]) == 0:
                del self.active_connections[appointment_id]

    async def broadcast(self, message: dict, appointment_id: int):
        if appointment_id in self.active_connections:
            for connection in self.active_connections[appointment_id]:
                await connection.send_json(message)

manager = ConnectionManager()
