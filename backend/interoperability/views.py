from rest_framework import viewsets
from .models import ExternalExchangeLog
from .serializers import ExternalExchangeLogSerializer
from accounts.permissions import IsSystemAdministrator

class ExternalExchangeLogViewSet(viewsets.ModelViewSet):
    queryset = ExternalExchangeLog.objects.all()
    serializer_class = ExternalExchangeLogSerializer
    permission_classes = [IsSystemAdministrator]
