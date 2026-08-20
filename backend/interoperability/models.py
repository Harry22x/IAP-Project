from django.db import models
from core.models import TimeStampedModel
from patients.models import Patient

class ExternalExchangeLog(TimeStampedModel):
    exchange_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='exchange_logs'
    )
    external_hospital = models.CharField(max_length=255)
    exchange_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Exchange {self.exchange_id} with {self.external_hospital}"
