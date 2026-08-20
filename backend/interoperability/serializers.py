from rest_framework import serializers
from .models import ExternalExchangeLog

class ExternalExchangeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExternalExchangeLog
        fields = '__all__'
