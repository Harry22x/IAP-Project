from django.db import models
from core.models import TimeStampedModel
from patients.models import Patient
from django.conf import settings

class MedicalRecord(TimeStampedModel):
    RECORD_TYPE_CHOICES = (
        ('GENERAL', 'General Health'),
        ('BLOOD_WORK', 'Detailed Blood Analysis'),
        ('HLA_TYPING', 'HLA Tissue Typing'),
        ('CROSSMATCH', 'Crossmatch Test'),
    )

    record_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='medical_records'
    )
    record_type = models.CharField(
        max_length=20, 
        choices=RECORD_TYPE_CHOICES, 
        default='GENERAL',
        db_index=True
    )
    lab_results = models.JSONField(
        help_text="Flexible schema. For HLA, use keys like 'hla_a', 'hla_b', etc."
    )
    test_date = models.DateField()
    expiry_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="Some tests like Crossmatch expire in 48-72 hours"
    )
    verified_status = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='verified_records'
    )

    @property
    def is_valid(self):
        from datetime import date
        if not self.verified_status:
            return False
        if self.expiry_date and self.expiry_date < date.today():
            return False
        return True

    def __str__(self):
        return f"{self.get_record_type_display()} for Patient {self.patient.patient_id} ({self.test_date})"
