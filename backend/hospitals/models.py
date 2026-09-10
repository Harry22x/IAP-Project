from django.db import models
from core.models import TimeStampedModel

class Hospital(TimeStampedModel):
    hospital_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    longitude = models.FloatField(max_length=255, default=36.8219)
    latitude = models.FloatField(max_length = 255, default=-1.2921)

    def __str__(self):
        return self.name
