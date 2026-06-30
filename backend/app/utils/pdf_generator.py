import io
import json
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch

def generate_prescription_pdf(prescription, appointment, patient, doctor) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Header
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.darkblue)
    c.drawString(50, height - 50, "Medicare+ Hospital")
    
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    c.drawString(50, height - 65, "123 Health Avenue, Medical City, MC 10001")
    c.drawString(50, height - 75, "Phone: +1 800 123 4567 | Email: info@medicareplus.com")
    
    c.setStrokeColor(colors.lightgrey)
    c.line(50, height - 90, width - 50, height - 90)
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 120, "MEDICAL PRESCRIPTION")
    
    c.setFont("Helvetica", 10)
    c.drawString(width - 150, height - 120, f"Date: {appointment.appointment_date}")
    
    # Doctor Details
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 150, "Doctor Details:")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 165, f"Dr. {doctor.full_name}")
    if doctor.doctor_profile:
        c.drawString(50, height - 180, f"Spec: {doctor.doctor_profile.specialization}")
    
    # Patient Details
    c.setFont("Helvetica-Bold", 10)
    c.drawString(300, height - 150, "Patient Details:")
    c.setFont("Helvetica", 10)
    c.drawString(300, height - 165, f"Name: {patient.full_name}")
    c.drawString(300, height - 180, f"Email: {patient.email}")
    if patient.phone:
        c.drawString(300, height - 195, f"Phone: {patient.phone}")
        
    c.setStrokeColor(colors.lightgrey)
    c.line(50, height - 220, width - 50, height - 220)
    
    # Medicines List
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 250, "Prescribed Medicines:")
    
    try:
        medicines = json.loads(prescription.medicines)
    except:
        medicines = []
        
    y_position = height - 270
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y_position, "Medicine Name")
    c.drawString(250, y_position, "Dosage")
    c.drawString(400, y_position, "Duration")
    
    y_position -= 15
    c.line(50, y_position, width - 50, y_position)
    y_position -= 15
    
    c.setFont("Helvetica", 10)
    for med in medicines:
        c.drawString(50, y_position, med.get('name', 'N/A'))
        c.drawString(250, y_position, med.get('dosage', 'N/A'))
        c.drawString(400, y_position, med.get('duration', 'N/A'))
        y_position -= 20
        
    y_position -= 20
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_position, "Special Instructions:")
    y_position -= 20
    
    c.setFont("Helvetica", 10)
    instructions = prescription.instructions or "None"
    
    # Simple word wrap for instructions
    from textwrap import wrap
    lines = wrap(instructions, width=80)
    for line in lines:
        c.drawString(50, y_position, line)
        y_position -= 15
        
    # Footer
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.grey)
    c.drawString(50, 50, "This is a computer-generated document and does not require a signature.")
    
    c.save()
    buffer.seek(0)
    return buffer.read()


def generate_invoice_pdf(invoice, appointment, patient) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Header
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(colors.darkblue)
    c.drawString(50, height - 50, "Medicare+ Hospital")
    
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    c.drawString(50, height - 65, "123 Health Avenue, Medical City, MC 10001")
    c.drawString(50, height - 75, "Phone: +1 800 123 4567 | Email: info@medicareplus.com")
    
    c.setStrokeColor(colors.lightgrey)
    c.line(50, height - 90, width - 50, height - 90)
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 120, "PAYMENT RECEIPT / INVOICE")
    
    c.setFont("Helvetica", 10)
    c.drawString(width - 200, height - 120, f"Invoice #: INV-{invoice.id:04d}")
    c.drawString(width - 200, height - 135, f"Date: {invoice.created_at.strftime('%Y-%m-%d')}")
    
    # Patient Details
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 160, "Bill To:")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 175, f"Name: {patient.full_name}")
    c.drawString(50, height - 190, f"Email: {patient.email}")
    if patient.phone:
        c.drawString(50, height - 205, f"Phone: {patient.phone}")
        
    # Billing Summary
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 250, "Charges:")
    
    y_position = height - 270
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y_position, "Description")
    c.drawString(450, y_position, "Amount")
    
    y_position -= 15
    c.line(50, y_position, width - 50, y_position)
    y_position -= 15
    
    c.setFont("Helvetica", 10)
    c.drawString(50, y_position, "Doctor Consultation Fee")
    c.drawString(450, y_position, f"Rs. {invoice.amount:.2f}")
    
    y_position -= 30
    c.setStrokeColor(colors.black)
    c.line(50, y_position, width - 50, y_position)
    
    y_position -= 20
    c.setFont("Helvetica-Bold", 12)
    c.drawString(350, y_position, "Total Due:")
    c.drawString(450, y_position, f"Rs. {invoice.amount:.2f}")
    
    y_position -= 30
    c.setFont("Helvetica", 10)
    c.drawString(50, y_position, f"Status: {invoice.status.upper()}")
    if invoice.transaction_id:
        y_position -= 15
        c.drawString(50, y_position, f"Transaction ID: {invoice.transaction_id}")
        
    # Footer
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.grey)
    c.drawString(50, 50, "Thank you for choosing Medicare+ Hospital.")
    
    c.save()
    buffer.seek(0)
    return buffer.read()
