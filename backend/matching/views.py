from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Match
from django.db import models
from patients.models import Recipient
from .serializers import MatchSerializer
from accounts.permissions import IsTransplantCoordinator, IsHealthcareProfessional, IsSystemAdministrator
from .services import OrganMatchingService

class MatchViewSet(viewsets.ModelViewSet):
    serializer_class = MatchSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsTransplantCoordinator | IsHealthcareProfessional | IsSystemAdministrator]
        else:
            permission_classes = [IsTransplantCoordinator]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Match.objects.none()
            
        if user.hospital:
            # Show matches where the donor or recipient is from the same hospital
            return Match.objects.filter(
                models.Q(recipient__recipient_id__hospital=user.hospital) |
                models.Q(donor__donor_id__hospital=user.hospital)
            ).distinct()
        return Match.objects.all()

    @action(detail=False, methods=['post'])
    def run(self, request):
        recipient_id = request.data.get('recipient_id')
        try:
            recipient = Recipient.objects.get(recipient_id__patient_id=recipient_id)
        except Recipient.DoesNotExist:
            return Response({'error': 'Recipient not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        matches = OrganMatchingService.get_compatible_donors(recipient)
        serializer = self.get_serializer(matches, many=True)
        return Response(serializer.data)
