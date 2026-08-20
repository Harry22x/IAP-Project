from django.db import models
from core.models import TimeStampedModel
from patients.models import Donor, Recipient

class Match(TimeStampedModel):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'), 
        ('APPROVED', 'Approved'), 
        ('REJECTED', 'Rejected'), 
        ('COMPLETED', 'Completed')
    )
    match_id = models.AutoField(primary_key=True)
    donor = models.ForeignKey(
        Donor, 
        on_delete=models.CASCADE, 
        related_name='matches'
    )
    recipient = models.ForeignKey(
        Recipient, 
        on_delete=models.CASCADE, 
        related_name='matches'
    )
    compatibility_score = models.DecimalField(max_digits=5, decimal_places=2)
    match_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    match_date = models.DateTimeField(auto_now_add=True)
    scheduled_date = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Match {self.match_id}: Score {self.compatibility_score}"
