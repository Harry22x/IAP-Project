from rest_framework import serializers
from .models import Match

class MatchSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.donor_id.name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.recipient_id.name', read_only=True)
    organ = serializers.CharField(source='donor.donor_id.organ_type', read_only=True)
    blood_type = serializers.CharField(source='donor.donor_id.blood_type', read_only=True)
    source = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            'match_id', 'donor', 'donor_name', 'recipient', 'recipient_name',
            'organ', 'blood_type', 'source', 'compatibility_score',
            'match_status', 'match_date', 'scheduled_date',
        ]

    def get_source(self, obj):
        return 'hospital'
