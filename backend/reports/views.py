from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from accounts.permissions import IsSystemAdministrator, IsTransplantCoordinator
from patients.models import Donor, Recipient
from matching.models import Match

class SystemReportViewSet(viewsets.ViewSet):
    permission_classes = [IsSystemAdministrator]

    @action(detail=False, methods=['get'])
    def operations(self, request):
        total_donors = Donor.objects.count()
        total_recipients = Recipient.objects.count()
        successful_matches = Match.objects.filter(match_status__in=['APPROVED', 'COMPLETED']).count()
        
        return Response({
            'total_donors': total_donors,
            'total_recipients': total_recipients,
            'successful_matches': successful_matches
        })

class TCStatsView(APIView):
    permission_classes = [IsTransplantCoordinator]

    def get(self, request):
        user_hospital = request.user.hospital
        
        if user_hospital:
            donors_count = Donor.objects.filter(donor_id__hospital=user_hospital).count()
            recipients_count = Recipient.objects.filter(recipient_id__hospital=user_hospital).count()
            matches = Match.objects.filter(recipient__recipient_id__hospital=user_hospital).order_by('-match_date')
        else:
            donors_count = Donor.objects.count()
            recipients_count = Recipient.objects.count()
            matches = Match.objects.all().order_by('-match_date')

        recent_matches = []
        for match in matches[:5]:
            recent_matches.append({
                'id': match.match_id,
                'donor_name': match.donor.donor_id.name,
                'recipient_name': match.recipient.recipient_id.name,
                'organ': match.donor.donor_id.organ_type,
                'score': float(match.compatibility_score),
                'status': match.match_status,
                'date': match.match_date.strftime('%Y-%m-%d')
            })

        return Response({
            'total_donors': donors_count,
            'total_recipients': recipients_count,
            'pending_matches': matches.filter(match_status='PENDING').count(),
            'recent_matches': recent_matches
        })

