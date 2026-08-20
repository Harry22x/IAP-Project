from django.db import models
from core.models import TimeStampedModel

class Hospital(TimeStampedModel):
    hospital_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)

    def __str__(self):
        return self.name
