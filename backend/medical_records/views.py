from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MedicalRecord
from .serializers import MedicalRecordSerializer
from accounts.permissions import IsHealthcareProfessional

class MedicalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalRecordSerializer
    
    def get_queryset(self):
        if self.request.user.hospital:
            return MedicalRecord.objects.filter(patient__hospital=self.request.user.hospital)
        return MedicalRecord.objects.all()

    @action(detail=True, methods=['patch'], permission_classes=[IsHealthcareProfessional])
    def verify(self, request, pk=None):
        record = self.get_object()
        record.verified_status = True
        record.verified_by = request.user
        record.save()
        return Response({'status': 'Record verified successfully'})
