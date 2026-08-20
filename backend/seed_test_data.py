import os
import django
from datetime import date, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from hospitals.models import Hospital
from patients.models import Patient, Donor, Recipient
from medical_records.models import MedicalRecord

User = get_user_model()

def seed_data():
    print("Seeding test data...")
    
    # 1. Create Hospital
    hospital, _ = Hospital.objects.get_or_create(name="St. Jude Hospital", location="City Center")
    
    # 2. Create User (Coordinator)
    coordinator, created = User.objects.get_or_create(
        email="coordinator@stjude.com",
        defaults={
            'name': 'John Coordinator',
            'role': 'COORDINATOR',
            'hospital': hospital
        }
    )
    if created:
        coordinator.set_password('pass123')
        coordinator.save()
    
    # 3. Create Recipient
    p_rec = Patient.objects.create(
        hospital=hospital,
        blood_type='A+',
        organ_type='KIDNEY',
        medical_history='Needs kidney transplant',
        urgency_level=3 # High
    )
    recipient = Recipient.objects.create(
        recipient_id=p_rec,
        waiting_list_status='ACTIVE'
    )
    
    # 4. Create donor (The Perfect Match)
    p_donor = Patient.objects.create(
        hospital=hospital,
        blood_type='A+', # Exact Match
        organ_type='KIDNEY',
        medical_history='Healthy donor',
        urgency_level=1
    )
    donor = Donor.objects.create(
        donor_id=p_donor,
        consent_status=True,
        availability=True
    )
    
    # 5. Create Medical Records for Donor
    MedicalRecord.objects.create(
        patient=p_donor,
        record_type='HLA_TYPING',
        lab_results={'hla': 'matching'},
        test_date=date.today(),
        verified_status=True
    )
    MedicalRecord.objects.create(
        patient=p_donor,
        record_type='CROSSMATCH',
        lab_results={'crossmatch': 'negative'},
        test_date=date.today(),
        expiry_date=date.today() + timedelta(days=2),
        verified_status=True
    )

    print(f"Test Data Created!")
    print(f"Recipient ID: {p_rec.patient_id}")
    print(f"Donor ID: {p_donor.patient_id}")
    print(f"Login with: coordinator@stjude.com / pass123")

if __name__ == "__main__":
    seed_data()
