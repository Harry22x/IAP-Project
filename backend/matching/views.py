from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Match
from django.db import models
from patients.models import Patient, Donor, Recipient
from .serializers import MatchSerializer
from accounts.permissions import IsTransplantCoordinator, IsHealthcareProfessional, IsSystemAdministrator
from .services import OrganMatchingService
from .artisan_client import fetch_artisan_donors

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

    def retrieve(self, request, *args, **kwargs):
        pk = str(kwargs.get('pk', ''))
        if pk.startswith('jk-'):
            artisan_id = pk.replace('jk-', '', 1)
            artisan_marker = f"[Jua Kali Artisan: {artisan_id}]"
            match = Match.objects.filter(donor__donor_id__medical_history__contains=artisan_marker).first()
            if match:
                serializer = self.get_serializer(match)
                return Response(serializer.data)
            return Response({
                'match_id': pk,
                'match_status': 'PENDING',
                'source': 'jua-kali',
                'artisan_id': artisan_id
            }, status=status.HTTP_200_OK)
        return super().retrieve(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        pk = str(kwargs.get('pk', ''))
        if pk.startswith('jk-'):
            return self._handle_artisan_match_update(request, pk)
        response = super().partial_update(request, *args, **kwargs)
        if request.data.get('match_status') == 'APPROVED':
            instance = self.get_object()
            if instance.recipient and instance.recipient.waiting_list_status != 'MATCHED':
                instance.recipient.waiting_list_status = 'MATCHED'
                instance.recipient.save()
        return response

    def update(self, request, *args, **kwargs):
        pk = str(kwargs.get('pk', ''))
        if pk.startswith('jk-'):
            return self._handle_artisan_match_update(request, pk)
        return super().update(request, *args, **kwargs)

    def _handle_artisan_match_update(self, request, pk):
        new_status = request.data.get('match_status', 'APPROVED')
        scheduled_date = request.data.get('scheduled_date')
        artisan_id = request.data.get('artisan_id') or pk.replace('jk-', '', 1)

        if new_status == 'REJECTED':
            return Response({
                'match_id': pk,
                'match_status': 'REJECTED',
                'source': 'jua-kali',
                'scheduled_date': None,
            }, status=status.HTTP_200_OK)

        # 1. Determine recipient
        recipient_id = request.data.get('recipient') or request.data.get('recipient_id')
        recipient = None
        if recipient_id:
            try:
                recipient = Recipient.objects.get(recipient_id__patient_id=recipient_id)
            except Recipient.DoesNotExist:
                return Response({'error': f'Recipient with id {recipient_id} not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            user_hospital = getattr(request.user, 'hospital', None)
            recipients = Recipient.objects.filter(waiting_list_status='ACTIVE')
            if user_hospital:
                hospital_recipients = recipients.filter(recipient_id__hospital=user_hospital)
                if hospital_recipients.exists():
                    recipient = hospital_recipients.first()
            if not recipient and recipients.exists():
                recipient = recipients.first()

        if not recipient:
            return Response({'error': 'Recipient information is required to approve this match.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Extract artisan details
        donor_name = request.data.get('donor_name')
        phone = request.data.get('phone')
        blood_type = request.data.get('blood_type')
        compatibility_score = request.data.get('compatibility_score')

        if not donor_name or not blood_type:
            from .artisan_client import fetch_artisan_donors
            artisans = fetch_artisan_donors()
            for a in artisans:
                if str(a.get('artisan_id')) == str(artisan_id):
                    donor_name = donor_name or a.get('name')
                    phone = phone or a.get('phone')
                    blood_type = blood_type or a.get('blood_group')
                    break

        # 3. Create or find the Patient and Donor profile for the artisan
        artisan_marker = f"[Jua Kali Artisan: {artisan_id}]"
        donor_patient = Patient.objects.filter(medical_history__contains=artisan_marker).first()
        if not donor_patient:
            donor_patient = Patient.objects.create(
                hospital=recipient.recipient_id.hospital,
                name=donor_name or f"Artisan {artisan_id}",
                blood_type=blood_type or recipient.recipient_id.blood_type,
                organ_type=recipient.recipient_id.organ_type,
                medical_history=f"Registered external donor from Team 1 Kazibuddy {artisan_marker}",
                urgency_level=1,
                phone_number=phone or "+254712345678"
            )

        donor, _ = Donor.objects.get_or_create(
            donor_id=donor_patient,
            defaults={'consent_status': True, 'availability': False}
        )

        # 4. Create or update the Match
        score = compatibility_score or 75.0
        match = Match.objects.filter(donor=donor, recipient=recipient).first()
        if not match:
            match = Match.objects.create(
                donor=donor,
                recipient=recipient,
                compatibility_score=score,
                match_status=new_status,
                scheduled_date=scheduled_date
            )
        else:
            match.match_status = new_status
            if scheduled_date:
                match.scheduled_date = scheduled_date
            match.save()

        if new_status == 'APPROVED':
            recipient.waiting_list_status = 'MATCHED'
            recipient.save()

        serializer = self.get_serializer(match)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def run(self, request):
        recipient_id = request.data.get('recipient_id')
        try:
            recipient = Recipient.objects.get(recipient_id__patient_id=recipient_id)
        except Recipient.DoesNotExist:
            return Response({'error': 'Recipient not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        matches = OrganMatchingService.get_compatible_donors(recipient)
        serializer = self.get_serializer(matches, many=True)
        producer_matches = OrganMatchingService.get_producer_matches(recipient)
        combined = list(serializer.data) + producer_matches
        combined.sort(key=lambda item: float(item.get('compatibility_score') or 0), reverse=True)
        return Response(combined)
