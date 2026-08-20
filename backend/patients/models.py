from django.db import models
from core.models import TimeStampedModel
from hospitals.models import Hospital

class Patient(TimeStampedModel):
    patient_id = models.AutoField(primary_key=True)
    hospital = models.ForeignKey(
        Hospital, 
        on_delete=models.CASCADE, 
        related_name='patients'
    )
    name = models.CharField(max_length=255, default='Unknown Patient')
    blood_type = models.CharField(max_length=10) 
    organ_type = models.CharField(max_length=100)
    medical_history = models.TextField()
    urgency_level = models.IntegerField(help_text="Higher number = more urgent", default=1)

    def __str__(self):
        return f"Patient {self.patient_id} ({self.organ_type})"

class Donor(models.Model):
    donor_id = models.OneToOneField(
        Patient, 
        on_delete=models.CASCADE, 
        primary_key=True, 
        related_name='donor_profile'
    )
    consent_status = models.BooleanField(default=False)
    availability = models.BooleanField(default=True)

    def __str__(self):
        return f"Donor {self.donor_id.patient_id}"

class Recipient(models.Model):
    WAITING_LIST_STATUS_CHOICES = (
        ('ACTIVE', 'Active'), 
        ('ON_HOLD', 'On Hold'), 
        ('MATCHED', 'Matched')
    )
    recipient_id = models.OneToOneField(
        Patient, 
        on_delete=models.CASCADE, 
        primary_key=True, 
        related_name='recipient_profile'
    )
    waiting_list_status = models.CharField(max_length=20, choices=WAITING_LIST_STATUS_CHOICES)

    def __str__(self):
        return f"Recipient {self.recipient_id.patient_id} - {self.waiting_list_status}"
