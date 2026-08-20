from rest_framework import viewsets
from .models import Hospital
from .serializers import HospitalSerializer
from rest_framework.permissions import IsAuthenticated

class HospitalViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.hospital:
            return Hospital.objects.filter(hospital_id=self.request.user.hospital_id)
        return Hospital.objects.all()
